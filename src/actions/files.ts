"use server";

import { revalidatePath } from "next/cache";
import {
	FileWithComments,
	FileWithLikes,
	FileWithTags,
	FolderWithFilesCount,
	FolderWithTags,
	RenameImageFormSchema,
	RequestFileUploadFormSchema,
} from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { z } from "zod";
import { generateV4DownloadUrl, GoogleBucket } from "@/lib/bucket";
import crypto from "node:crypto";
import { FileType, FileLike } from "@prisma/client";
import { canLikeFile, isAllowedToAccessFile } from "@/lib/dal";
import { AccessTokenService } from "@/data/access-token-service";
import { FolderService } from "@/data/folder-service";
import { FileService } from "@/data/file-service";
import { FileLikeService } from "@/data/file-like-service";
import { SecureService } from "@/data/secure/secure-service";
import { FolderPermission } from "@/data/secure/folder";
import { FileVerificationService } from "@/data/file-verification-service";
import { FilePermission } from "@/data/secure/file";

export async function initiateFileUpload(
	data: z.infer<typeof RequestFileUploadFormSchema>,
	parentFolderId: string,
	token?: string,
	key?: string
): Promise<{
	error: string | null;
	uploadUrl: string | null;
	verificationToken?: string;
	fileId?: string;
}> {
	const parsed = RequestFileUploadFormSchema.safeParse(data);

	if (!parsed.success) {
		return { error: "invalid-data", uploadUrl: null };
	}

	const folder = await FolderService.get({ where: { id: parentFolderId }, include: { accessTokens: true } });

	if (!folder) {
		return { error: "folder-not-found", uploadUrl: null };
	}

	const auth = await SecureService.folder.enforce(folder, token, key, FolderPermission.WRITE);

	if (!auth.allowed) {
		return { error: "not-authenticated", uploadUrl: null };
	}

	const { user } = auth.session;

	const { name, size, type, md5 } = parsed.data;

	// Validate file type
	if (!isValidFileType(type)) {
		return { error: "invalid-file-type", uploadUrl: null };
	}

	const fileId = crypto.randomBytes(16).toString("hex");

	try {
		const expectedObjectPath = `${folder.createdById}/${parentFolderId}/${fileId}`;
		const [fileName, extension] = name.split(".");
		const file = await FileService.create({
			id: fileId,
			name: fileName,
			extension: extension,
			type: type.startsWith("image/") ? FileType.IMAGE : FileType.VIDEO,
			size: size,
			folder: { connect: { id: parentFolderId } },
			createdBy: { connect: { id: user ? user.id : folder.createdById } },
		});

		const fileVerification = await FileVerificationService.create({
			objectPath: expectedObjectPath,
			expectedMime: type,
			expectedSize: size,
			expectedMd5: md5,
			file: { connect: { id: file.id } },
		});

		// Generate signed URL for upload
		const [uploadUrl] = await GoogleBucket.file(
			`${folder.createdById}/${parentFolderId}/${fileId}`
		).getSignedUrl({
			version: "v4",
			action: "write",
			expires: Date.now() + 15 * 60 * 1000, // 15 minutes
			contentType: type,
		});

		return {
			error: null,
			uploadUrl,
			verificationToken: fileVerification.id,
			fileId,
		};
	} catch (err) {
		console.error("Error initiating upload:", err);
		return { error: "upload-initiation-failed", uploadUrl: null };
	}
}

export async function finalizeFileUpload(
	verificationId: string,
	parentFolderId: string,
	token?: string,
	key?: string
): Promise<{
	error: string | null;
	file:
		| (FileWithTags &
				FileWithComments &
				FileWithLikes & { folder: FolderWithFilesCount & FolderWithTags } & {
					signedUrl: string;
				})
		| null;
}> {
	const folder = await FolderService.get({ where: { id: parentFolderId }, include: { accessTokens: true } });

	if (!folder) {
		return { error: "folder-not-found", file: null };
	}

	const auth = await SecureService.folder.enforce(folder, token, key, FolderPermission.WRITE);
	if (!auth.allowed) {
		return { error: "not-authenticated", file: null };
	}

	const fileVerification = await FileVerificationService.get({ where: { id: verificationId } });

	if (!fileVerification) {
		return { error: "verification-not-found", file: null };
	}

	console.log("Verifying with metadata", fileVerification);

	try {
		// Get verification data
		const [fileMetadata] = await GoogleBucket.file(fileVerification.objectPath).getMetadata();
		console.log("Google metadata", fileMetadata);

		if (fileMetadata.size?.toString() !== fileVerification.expectedSize.toString()) {
			await GoogleBucket.file(fileVerification.objectPath).delete();
			await FileService.delete(fileVerification.fileId);
			return { error: "file-size-mismatch", file: null };
		}

		if (fileMetadata.contentType !== fileVerification.expectedMime) {
			await GoogleBucket.file(fileVerification.objectPath).delete();
			await FileService.delete(fileVerification.fileId);
			return { error: "file-type-mismatch", file: null };
		}

		if (fileMetadata.md5Hash !== fileVerification.expectedMd5) {
			await GoogleBucket.file(fileVerification.objectPath).delete();
			await FileService.delete(fileVerification.fileId);
			return { error: "file-integrity-check-failed", file: null };
		}

		await FileVerificationService.delete(fileVerification.id);

		let updatedFile;
		if (fileVerification.expectedMime.startsWith("image/")) {
			updatedFile = await FileService.extractAndSaveImageMetadata(
				folder.id,
				fileVerification.fileId,
				fileVerification.objectPath
			);
		} else if (fileVerification.expectedMime.startsWith("video/")) {
			updatedFile = await FileService.extractAndSaveVideoMetadata(
				folder.id,
				fileVerification.fileId,
				fileVerification.objectPath
			);
		} else {
			return { error: "invalid-file-type", file: null };
		}

		revalidatePath(`/app/folders/${parentFolderId}`);
		revalidatePath(`/app/folders`);
		revalidatePath(`/app`);

		const signedUrl = await generateV4DownloadUrl(
			`${folder.createdById}/${parentFolderId}/${fileVerification.fileId}`
		);
		return { error: null, file: { ...updatedFile, signedUrl } };
	} catch (err) {
		console.error("Error finalizing upload:", err);
		return { error: "upload-finalization-failed", file: null };
	}
}

// Helper function to validate file type
function isValidFileType(fileType: string): boolean {
	return fileType.startsWith("image/") || fileType.startsWith("video/");
}

export async function getImagesWithFolderAndCommentsFromFolder(folderId: string): Promise<{
	images: (FileWithTags & FileWithComments & { folder: FolderWithTags })[];
	error: string | null;
}> {
	const { user } = await getCurrentSession();

	if (!user) {
		return {
			error: "You must be logged in to load files from folder",
			images: [],
		};
	}

	const files = await FileService.getMultiple({
		where: {
			folder: { id: folderId },
			createdBy: { id: user.id },
			type: FileType.IMAGE,
		},
		include: {
			folder: { include: { tags: true } },
			comments: { include: { createdBy: true } },
			tags: true,
		},
	});

	return { error: null, images: files };
}

export async function renameFile(
	fileId: string,
	data: z.infer<typeof RenameImageFormSchema>
): Promise<{ error: string | null }> {
	const { user } = await getCurrentSession();

	if (!user) {
		return { error: "You must be logged in to rename files" };
	}

	const parsedData = RenameImageFormSchema.safeParse(data);

	if (!parsedData.success) {
		return { error: "invalid-data" };
	}

	try {
		const image = await FileService.update(fileId, { name: parsedData.data.name });
		revalidatePath(`/app/folders/${image.folderId}`);
	} catch (err) {
		console.error("Error renaming image:", err);
		return { error: "Image not found" };
	}

	revalidatePath("/app");
	return { error: null };
}

export async function updateFileDescription(fileId: string, description: string): Promise<{ error: string | null }> {
	const { user } = await getCurrentSession();

	if (!user) {
		return { error: "You must be logged in to update file description" };
	}

	const image = await FileService.update(fileId, { description });

	revalidatePath(`/app/folders/${image.folderId}`);
	return { error: null };
}

export async function likeFile(
	fileId: string,
	shareToken?: string | null,
	accessKey?: string | null
): Promise<{ error: string | null; like?: FileLike; liked?: boolean }> {
	const canLike = await canLikeFile(fileId, shareToken, accessKey);
	if (!canLike) {
		return { error: "You do not have permission to like this file" };
	}

	const file = await FileService.get({
		where: { id: fileId },
	});

	if (!file) {
		return { error: "File not found" };
	}

	const { user } = await getCurrentSession();

	if (user) {
		const existingLike = await FileLikeService.get({
			method: "first",
			where: { fileId, createdById: user.id },
		});

		if (existingLike) {
			const like = await FileLikeService.delete(existingLike.id);
			return { error: null, like: like, liked: false };
		}

		const file = await FileService.update(
			fileId,
			{
				likes: { create: { createdById: user.id, createdByEmail: user.email } },
			},
			{ likes: true }
		);

		return {
			error: null,
			like: file.likes[file.likes.length - 1],
			liked: true,
		};
	} else if (shareToken) {
		const token = await AccessTokenService.get({
			where: { token: shareToken },
		});

		if (!token) {
			return { error: "Invalid share token" };
		}

		const existingLike = await FileLikeService.get({
			method: "first",
			where: { fileId, createdByEmail: token.email },
		});

		if (existingLike) {
			const like = await FileLikeService.delete(existingLike.id);
			return { error: null, like: like, liked: false };
		}

		const like = await FileService.update(
			fileId,
			{
				likes: { create: { createdByEmail: token.email } },
			},
			{ likes: true }
		);

		return {
			error: null,
			like: like.likes[like.likes.length - 1],
			liked: true,
		};
	} else {
		return { error: "You don't have permission to like this file" };
	}
}

export async function updateFilePosition(
	fileId: string,
	previousId?: string,
	nextId?: string
): Promise<{ error: string | null; newPosition?: number }> {
	const file = await FileService.get({
		where: { id: fileId },
		include: { folder: { include: { accessTokens: true } } },
	});

	if (!file) {
		return { error: "file-not-found" };
	}

	const auth = await SecureService.file.enforce(file, FilePermission.UPDATE);

	if (!auth.isAllowed) {
		return { error: "unauthorized" };
	}

	let previousFile = null;
	let nextFile = null;

	if (previousId) {
		previousFile = await FileService.get({
			where: { id: previousId },
		});

		if (previousFile?.folderId !== file.folderId) {
			return { error: "file-not-in-folder" };
		}
	}

	if (nextId) {
		nextFile = await FileService.get({
			where: { id: nextId },
		});

		if (nextFile?.folderId !== file.folderId) {
			return { error: "file-not-in-folder" };
		}
	}

	if (previousFile && nextFile && previousFile.position > nextFile.position) {
		return {
			error: "Previous file position must be less than next file position",
		};
	}

	const delta = (nextFile?.position || 0) - (previousFile?.position || 0);
	if (delta < 2) {
		await reNormalizePositions(file.folderId);
		return updateFilePosition(fileId, previousId, nextId);
	}

	let position = 1;
	// Handle start inserting edge case
	if (!previousFile && nextFile && nextFile.position < 2) {
		await reNormalizePositions(file.folderId);
		position = 500;
	} else if (!previousFile && nextFile) {
		position = nextFile.position / 2;
	}

	if (!nextFile && previousFile) {
		position = previousFile.position + 1000;
	}

	if (previousFile && nextFile) {
		position = (nextFile.position + previousFile.position) / 2;
	}

	try {
		await FileService.update(fileId, { position });
	} catch (err) {
		console.error("Error updating file position:", err);
		return { error: "Failed to update file position" };
	}

	return { error: null, newPosition: position };
}

export async function deleteFile(fileId: string, shareToken?: string, hashPin?: string) {
	const isAllowed = await isAllowedToAccessFile(fileId, shareToken, hashPin);

	if (!isAllowed) {
		return { error: "You do not have permission to delete this file" };
	}

	// Check if user is authorized to delete this image
	// (User was the creator of the folder containing the image)

	const file = await FileService.get({
		where: { id: fileId },
	});

	if (!file) {
		return { error: "File not found" };
	}

	if (file.type === FileType.VIDEO) {
		try {
			await GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.thumbnail}`).delete();
		} catch (err) {
			console.error("Error deleting video thumbnail:", err);
		}
	}

	try {
		await GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.id}`).delete();
	} catch (err) {
		console.error("Error deleting file from bucket:", err);
	}

	await FileService.delete(fileId);

	revalidatePath(`/app/folders/${file.folderId}`);
	revalidatePath(`/app/folders`);
	return { error: null };
}

export async function deleteFiles(files: string[]) {
	for (const file of files) {
		await deleteFile(file);
	}
	return { error: null };
}

async function reNormalizePositions(folderId: string) {
	const files = await FileService.getMultiple({
		where: { folderId },
		orderBy: { position: "asc" },
	});

	for (let i = 0; i < files.length; i++) {
		await FileService.update(files[i].id, { position: 1000 + i * 1000 });
	}
}
