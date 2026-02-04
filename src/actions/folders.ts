"use server";

import { revalidatePath } from "next/cache";
import { GoogleBucket } from "@/lib/bucket";
import { FolderService } from "@/data/folder-service";
import { AuthService } from "@/data/secure/auth";
import { SecureService } from "@/data/secure/secure-service";
import { FolderPermission } from "@/data/secure/folder";

export async function createFolder(name: string): Promise<{
	folder: {
		id: string;
		name: string;
		coverId: string | null;
		createdById: string;
		createdAt: Date;
		updatedAt: Date;
	} | null;
	error: string | null;
}> {
	const { isAuthenticated, session } = await AuthService.isAuthenticated();

	if (!isAuthenticated) {
		return { folder: null, error: "You must be logged in to create a folders" };
	}

	const readToken = crypto.randomUUID();
	const writeToken = crypto.randomUUID();
	const folder = await FolderService.create({
		name: name,
		createdBy: { connect: { id: session.user.id } },
		accessTokens: {
			create: [
				{
					token: readToken,
					permission: "READ",
					expires: new Date(new Date().setMonth(new Date().getMonth() + 8)),
				},
				{
					token: writeToken,
					permission: "WRITE",
					expires: new Date(new Date().setMonth(new Date().getMonth() + 8)),
				},
			],
		},
	});

	revalidatePath("/app/folders");
	revalidatePath("/app");
	return { folder: folder, error: null };
}

export async function updateFolderKey(
	folderId: string,
	key: string,
	iv: string
): Promise<{
	error: string | null;
}> {
	const folder = await FolderService.get({
		where: { id: folderId },
		include: { accessTokens: true },
	});

	const auth = await SecureService.folder.enforce(folder, undefined, undefined, FolderPermission.WRITE);

	if (!auth.allowed) {
		return { error: "Forbidden" };
	}

	await FolderService.update(folderId, { key, iv });

	return { error: null };
}

export async function renameFolder(
	folderId: string,
	name: string
): Promise<{
	folder: {
		id: string;
		name: string;
		coverId: string | null;
		createdById: string;
		createdAt: Date;
		updatedAt: Date;
	} | null;
	error: string | null;
}> {
	const folder = await FolderService.get({
		where: { id: folderId },
		include: { accessTokens: true },
	});

	const auth = await SecureService.folder.enforce(folder, undefined, undefined, FolderPermission.WRITE);

	if (!auth.allowed) {
		return { folder: null, error: "Forbidden" };
	}

	const updatedFolder = await FolderService.update(folderId, { name: name });

	revalidatePath("/app/folders");
	revalidatePath("/app");
	return { folder: updatedFolder, error: null };
}

export async function changeFolderCover(
	folderId: string,
	coverId: string
): Promise<{
	error: string | null;
}> {
	const folder = await FolderService.get({
		where: { id: folderId },
		include: { accessTokens: true },
	});

	const auth = await SecureService.folder.enforce(folder, undefined, undefined, FolderPermission.WRITE);

	if (!auth.allowed) {
		return { error: "Forbidden" };
	}

	await FolderService.update(folderId, {
		cover: {
			connect: {
				id: coverId,
			},
		},
	});

	revalidatePath("/app");
	revalidatePath("/app/folders");
	return { error: null };
}

export async function changeFolderDescription(
	folderId: string,
	description: string
): Promise<{
	error: string | null;
}> {
	const folder = await FolderService.get({
		where: { id: folderId },
		include: { accessTokens: true },
	});

	const auth = await SecureService.folder.enforce(folder, undefined, undefined, FolderPermission.WRITE);

	if (!auth.allowed) {
		return { error: "Forbidden" };
	}

	await FolderService.update(folderId, { description: description });

	revalidatePath("/app/folders");
	return { error: null };
}

export async function deleteFolderDescription(folderId: string): Promise<{ error: string | null }> {
	const folder = await FolderService.get({
		where: { id: folderId },
		include: { accessTokens: true },
	});

	const auth = await SecureService.folder.enforce(folder, undefined, undefined, FolderPermission.WRITE);

	if (!auth.allowed) {
		return { error: "Forbidden" };
	}

	await FolderService.update(folderId, { description: null });

	revalidatePath("/app/folders");
	return { error: null };
}

export async function deleteFolder(folderId: string): Promise<{ error: string | null }> {
	const folder = await FolderService.get({
		where: { id: folderId },
		include: { accessTokens: true },
	});

	const auth = await SecureService.folder.enforce(folder, undefined, undefined, FolderPermission.WRITE);

	if (!auth.allowed) {
		return { error: "Forbidden" };
	}

	try {
		await GoogleBucket.deleteFiles({ prefix: `${folder?.createdById}/${folderId}/` });
	} catch (e) {
		console.error("Error deleting folder from bucket", e);
	}

	await FolderService.delete(folderId);

	revalidatePath("/app/folders");
	revalidatePath("/app");
	return { error: null };
}
