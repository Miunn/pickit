"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { GoogleBucket } from "@/lib/bucket";
import { hasFolderOwnerAccess } from "@/lib/dal";

export async function createFolder(name: string): Promise<{
    folder: { id: string; name: string; coverId: string | null; createdById: string; createdAt: Date; updatedAt: Date; } | null,
    error: string | null,
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { folder: null, error: "You must be logged in to create a folders" };
    }

    const readToken = crypto.randomUUID();
    const writeToken = crypto.randomUUID();
    const folder = await prisma.folder.create({
        data: {
            name: name,
            createdBy: {
                connect: {
                    id: user.id as string
                }
            },
            AccessToken: {
                create: [
                    {
                        token: readToken,
                        permission: "READ",
                        expires: new Date(new Date().setMonth((new Date()).getMonth() + 8)),
                    },
                    {
                        token: writeToken,
                        permission: "WRITE",
                        expires: new Date(new Date().setMonth((new Date()).getMonth() + 8)),
                    }
                ]
            }
        }
    });

    revalidatePath("/app/folders");
    revalidatePath("/app");
    return { folder: folder, error: null };
}

export async function updateFolderKey(folderId: string, key: string, iv: string): Promise<{
    error: string | null,
}> {
    if (!(await hasFolderOwnerAccess(folderId))) {
        return { error: "You must be the owner of the folder to update its key" };
    }

    const { user } = await getCurrentSession();
    if (!user) {
        return { error: "You must be logged in to update a folder's key" };
    }

    await prisma.folder.update({
        where: { id: folderId, createdBy: { id: user.id as string } },
        data: { key, iv }
    });

    return { error: null };
}

export async function renameFolder(folderId: string, name: string): Promise<{
    folder: { id: string; name: string; coverId: string | null; createdById: string; createdAt: Date; updatedAt: Date; } | null,
    error: string | null,
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { folder: null, error: "You must be logged in to rename a folders" };
    }

    const folder = await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: user.id as string
            }
        },
        data: {
            name: name,
        }
    });

    revalidatePath("/app/folders");
    revalidatePath("/app");
    return { folder: folder, error: null };
}

export async function changeFolderCover(folderId: string, coverId: string): Promise<{
    error: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to change a folder's cover" };
    }

    await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: user.id as string
            }
        },
        data: {
            cover: {
                connect: {
                    id: coverId
                }
            }
        }
    });

    revalidatePath("/app");
    revalidatePath("/app/folders");
    return { error: null }
}

export async function changeFolderDescription(folderId: string, description: string): Promise<{
    error: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to change a folder's description" };
    }

    await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: user.id as string
            }
        },
        data: {
            description: description
        }
    })

    revalidatePath("/app/folders");
    return { error: null }
}

export async function deleteFolderDescription(folderId: string): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to delete a folder's description" };
    }

    await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: { id: user.id as string }
        },
        data: { description: null }
    })

    revalidatePath("/app/folders");
    return { error: null }
}

export async function deleteFolder(folderId: string): Promise<any> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to delete a folders" };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: { id: user.id as string }
        },
        select: {
            createdBy: {
                select: { id: true }
            }
        }
    })

    if (!folder) {
        return { error: "folder-not-found" };
    }

    try {
        await GoogleBucket.deleteFiles({ prefix: `${user.id}/${folderId}/`,  });
    } catch (e) {
        console.error("Error deleting folder from bucket", e);
    }

    await prisma.folder.delete({
        where: { id: folderId }
    });

    revalidatePath("/app/folders");
    revalidatePath("/app");
    return { error: null };
}