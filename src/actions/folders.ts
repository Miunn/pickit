"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/data/session";
import { GoogleBucket } from "@/lib/bucket";
import { hasFolderOwnerAccess } from "@/data/dal";
import { FolderService } from "@/data/folder-service";

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
	const { user } = await getCurrentSession();

	if (!user) {
		return { folder: null, error: "You must be logged in to create a folders" };
	}

	const readToken = crypto.randomUUID();
	const writeToken = crypto.randomUUID();
	const folder = await FolderService.create({
		name: name,
		createdBy: { connect: { id: user.id } },
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
	if (!(await hasFolderOwnerAccess(folderId))) {
		return { error: "You must be the owner of the folder to update its key" };
	}

	const { user } = await getCurrentSession();
	if (!user) {
		return { error: "You must be logged in to update a folder's key" };
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
	const { user } = await getCurrentSession();

	if (!user) {
		return { folder: null, error: "You must be logged in to rename a folders" };
	}

	const folder = await FolderService.update(folderId, { name: name });

	revalidatePath("/app/folders");
	revalidatePath("/app");
	return { folder: folder, error: null };
}

export async function changeFolderCover(
	folderId: string,
	coverId: string
): Promise<{
	error: string | null;
}> {
	const { user } = await getCurrentSession();

	if (!user) {
		return { error: "You must be logged in to change a folder's cover" };
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
	const { user } = await getCurrentSession();

	if (!user) {
		return { error: "You must be logged in to change a folder's description" };
	}

	await FolderService.update(folderId, { description: description });

	revalidatePath("/app/folders");
	return { error: null };
}

export async function deleteFolderDescription(folderId: string): Promise<{ error: string | null }> {
	const { user } = await getCurrentSession();

	if (!user) {
		return { error: "You must be logged in to delete a folder's description" };
	}

	await FolderService.update(folderId, { description: null });

	revalidatePath("/app/folders");
	return { error: null };
}

export async function deleteFolder(folderId: string): Promise<{ error: string | null }> {
	const { user } = await getCurrentSession();

	if (!user) {
		return { error: "You must be logged in to delete a folders" };
	}

	const folder = await FolderService.get({
		where: {
			id: folderId,
			createdBy: { id: user.id as string },
		},
		select: {
			createdBy: {
				select: { id: true },
			},
		},
	});

	if (!folder) {
		return { error: "folder-not-found" };
	}

	try {
		await GoogleBucket.deleteFiles({ prefix: `${user.id}/${folderId}/` });
	} catch (e) {
		console.error("Error deleting folder from bucket", e);
	}

	await FolderService.delete(folderId);

	revalidatePath("/app/folders");
	revalidatePath("/app");
	return { error: null };
}
