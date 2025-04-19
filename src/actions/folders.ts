"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImages, FolderWithImagesWithFolder, FolderWithImagesWithFolderAndComments, FolderWithVideosWithFolderAndComments, LightFolder, PersonAccessTokenWithFolderWithCreatedBy } from "@/lib/definitions";
import { FolderTokenPermission } from "@prisma/client";
import { getCurrentSession } from "@/lib/session";
import { GoogleBucket } from "@/lib/bucket";
import { validateShareToken } from "./tokenValidation";
export async function getLightFolders(): Promise<{
    lightFolders: LightFolder[],
    error?: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { lightFolders: [], error: "You must be logged in to create a folders" };
    }

    const folders = await prisma.folder.findMany({
        where: {
            createdBy: {
                id: user.id as string
            }
        },
        select: {
            id: true,
            name: true
        }
    });

    return { lightFolders: folders, error: null }
}

export async function getFolderName(id: string): Promise<{
    folder?: LightFolder | null,
    error?: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { folder: null, error: "You must be logged in to get folder name" };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: id,
            createdBy: {
                id: user.id as string
            }
        },
        select: {
            id: true,
            name: true
        }
    });

    return { folder: folder, error: null }
}

export async function getFolderFull(folderId: string, shareToken?: string, tokenType?: "accessToken" | "personAccessToken", hashedPinCode?: string): Promise<{
    error: string | null,
    folder: (FolderWithCreatedBy & FolderWithImages & FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments & FolderWithAccessToken) | null
    permission?: FolderTokenPermission
}> {
    const { user } = await getCurrentSession();

    if (!user && !shareToken) {
        return { error: "unauthorized", folder: null };
    }

    if (shareToken) {
        const dataFromToken = await validateShareToken(folderId, shareToken, tokenType as "accessToken" | "personAccessToken", hashedPinCode);
        
        if (!dataFromToken.error || dataFromToken.error !== "invalid-token" || !user) {
            return dataFromToken;
        }
    }

    if (!user) {
        return { error: "unauthorized", folder: null };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: { id: user.id }
        },
        include: {
            images: {
                include: {
                    folder: true,
                    comments: { include: { createdBy: true } }
                },
            },
            videos: {
                include: {
                    folder: true,
                    comments: { include: { createdBy: true } }
                }
            },
            createdBy: true,
            AccessToken: true
        }
    });

    return { error: null, folder: folder };
}

export async function getSharedWithMeFolders(): Promise<{
    accessTokens: PersonAccessTokenWithFolderWithCreatedBy[],
    error?: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { accessTokens: [], error: "unauthorized" };
    }

    const accessTokens = await prisma.personAccessToken.findMany({
        where: { email: user.email },
        include: { folder: { include: { createdBy: true } } }
    });

    return { accessTokens: accessTokens, error: null }
}

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