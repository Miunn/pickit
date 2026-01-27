"use server";

import { hasFolderOwnerAccess } from "@/data/dal";
import { getCurrentSession } from "@/data/session";
import { FolderTag } from "@prisma/client";
import { FileWithTags } from "@/lib/definitions";
import { FolderTagService } from "@/data/folder-tag-service";
import { FileService } from "@/data/file-service";

/**
 * Create a folder tag and optionally attach it to a file.
 *
 * Validates input and folder ownership, associates the new tag with the specified folder
 * (and with the file when `fileId` is provided), and returns the created tag on success
 * or an error message on failure.
 *
 * @param name - Tag display name; must be non-empty
 * @param color - Tag color value (for example, a hex code or color name)
 * @param folderId - ID of the folder to associate the tag with
 * @param fileId - Optional file ID to attach the created tag to
 * @returns `{ success: true; tag: FolderTag }` with the created tag on success, `{ success: false; error: string }` with an error message otherwise
 */
export async function createTag(
	name: string,
	color: string,
	folderId: string,
	fileId?: string
): Promise<{ success: true; tag: FolderTag } | { success: false; error: string }> {
	if (name.length === 0) {
		return {
			success: false,
			error: "name is required",
		};
	}

	if (!(await hasFolderOwnerAccess(folderId))) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const session = await getCurrentSession();
	if (!session?.user) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	try {
		const tag = await FolderTagService.create({
			name,
			color,
			folder: { connect: { id: folderId } },
			files: fileId ? { connect: { id: fileId } } : undefined,
			user: { connect: { id: session.user.id } },
		});
		return {
			success: true,
			tag,
		};
	} catch (error) {
		console.error("Error creating tag:", error);
		return {
			success: false,
			error: "failed to create tag",
		};
	}
}

/**
 * Attach multiple existing folder tags to a single file.
 *
 * Verifies the current user and folder ownership, ensures all specified tags exist and belong to the file's folder and user, and adds any tags that are not already attached.
 *
 * @param fileId - The ID of the file to update
 * @param tagIds - Array of folder tag IDs to attach to the file
 * @returns On success, an object with `success: true`, `tags` containing the file's tags after the operation, and `file` as the updated file; on failure, an object with `success: false` and an `error` message describing the reason
 */
export async function addTagsToFile(
	fileId: string,
	tagIds: string[]
): Promise<{ success: true; tags: FolderTag[]; file: FileWithTags } | { success: false; error: string }> {
	if (tagIds.length === 0) {
		return {
			success: false,
			error: "no tags to add",
		};
	}

	const session = await getCurrentSession();
	if (!session?.user) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const file = await FileService.get({
		where: { id: fileId },
		include: { tags: true },
	});

	if (!file) {
		return {
			success: false,
			error: "file not found",
		};
	}

	if (!(await hasFolderOwnerAccess(file.folderId))) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const tags = await FolderTagService.getMultiple({
		where: {
			id: { in: tagIds },
			userId: session.user.id,
			folderId: file.folderId,
		},
	});

	if (tags.length !== tagIds.length) {
		return {
			success: false,
			error: "some tags not found",
		};
	}

	const existingTags = file.tags.filter(tag => tags.some(t => t.id === tag.id));

	const newTags = tags.filter(tag => !existingTags.some(t => t.id === tag.id));

	const updatedFile = await FileService.update(
		fileId,
		{ tags: { connect: newTags.map(tag => ({ id: tag.id })) } },
		{ tags: true }
	);

	return {
		success: true,
		tags: [...existingTags, ...newTags],
		file: updatedFile,
	};
}

export async function addTagsToFiles(
	filesId: string[],
	tagIds: string[]
): Promise<{ success: true; tags: FolderTag[]; files: FileWithTags[] } | { success: false; error: string }> {
	if (tagIds.length === 0 || filesId.length === 0) {
		return {
			success: false,
			error: "no tags or files to add",
		};
	}

	const session = await getCurrentSession();
	if (!session?.user) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const files = await FileService.getMultiple({
		where: { id: { in: filesId } },
		include: { tags: true },
	});

	if (files.length !== filesId.length) {
		return {
			success: false,
			error: "file not found",
		};
	}

	const folderIds = files.map(f => f.folderId);
	const areUniqueFolder = folderIds.every(f => folderIds[0] === f);

	if (!areUniqueFolder || !(await hasFolderOwnerAccess(folderIds[0]))) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const tags = await FolderTagService.getMultiple({
		where: {
			id: { in: tagIds },
			userId: session.user.id,
			folderId: folderIds[0],
		},
	});

	if (tags.length !== tagIds.length) {
		return {
			success: false,
			error: "some tags not found",
		};
	}

	const updatedFiles = files.map(async file => {
		const existingTags = file.tags.filter(tag => tags.some(t => t.id === tag.id));

		const newTags = tags.filter(tag => !existingTags.some(t => t.id === tag.id));

		return await FileService.update(
			file.id,
			{ tags: { connect: newTags.map(t => ({ id: t.id })) } },
			{ tags: true }
		);
	});

	return {
		success: true,
		tags: tags,
		files: await Promise.all(updatedFiles),
	};
}

export async function removeTagsFromFile(
	fileId: string,
	tagIds: string[]
): Promise<{ success: true; tags: FolderTag[]; file: FileWithTags } | { success: false; error: string }> {
	if (tagIds.length === 0) {
		return {
			success: false,
			error: "no tags to remove",
		};
	}

	const session = await getCurrentSession();
	if (!session?.user) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const file = await FileService.get({
		where: { id: fileId },
		include: { tags: true },
	});

	if (!file) {
		return {
			success: false,
			error: "file not found",
		};
	}

	if (!(await hasFolderOwnerAccess(file.folderId))) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const tags = await FolderTagService.getMultiple({
		where: {
			id: { in: tagIds },
			userId: session.user.id,
			folderId: file.folderId,
		},
	});

	if (tags.length !== tagIds.length) {
		return {
			success: false,
			error: "some tags not found",
		};
	}

	const existingTags = file.tags.filter(tag => tags.some(t => t.id === tag.id));

	const newTags = tags.filter(tag => !existingTags.some(t => t.id === tag.id));

	const updatedFile = await FileService.update(
		fileId,
		{ tags: { disconnect: tags.map(tag => ({ id: tag.id })) } },
		{ tags: true }
	);

	return {
		success: true,
		tags: [...existingTags, ...newTags],
		file: updatedFile,
	};
}

export async function removeTagsFromFiles(
	fileIds: string[],
	tagIds: string[]
): Promise<{ success: true; tags: FolderTag[]; files: FileWithTags[] } | { success: false; error: string }> {
	if (tagIds.length === 0 || fileIds.length === 0) {
		return {
			success: false,
			error: "no tags to remove",
		};
	}

	const session = await getCurrentSession();
	if (!session?.user) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const files = await FileService.getMultiple({
		where: { id: { in: fileIds } },
		include: { tags: true },
	});

	if (files.length !== fileIds.length) {
		return {
			success: false,
			error: "file not found",
		};
	}

	const folderIds = files.map(f => f.folderId);
	const areUniqueFolder = folderIds.every(f => folderIds[0] === f);

	if (!areUniqueFolder || !(await hasFolderOwnerAccess(folderIds[0]))) {
		return {
			success: false,
			error: "unauthorized",
		};
	}

	const tags = await FolderTagService.getMultiple({
		where: {
			id: { in: tagIds },
			userId: session.user.id,
			folderId: folderIds[0],
		},
	});

	if (tags.length !== tagIds.length) {
		return {
			success: false,
			error: "some tags not found",
		};
	}

	const updatedFiles = files.map(async file => {
		return await FileService.update(
			file.id,
			{ tags: { disconnect: tags.map(t => ({ id: t.id })) } },
			{ tags: true }
		);
	});

	return {
		success: true,
		tags: tags,
		files: await Promise.all(updatedFiles),
	};
}
