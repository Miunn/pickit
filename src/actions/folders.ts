"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "@/actions/auth";
import * as fs from "fs";
import { revalidatePath } from "next/cache";
import { LightFolder, LockFolderFormSchema } from "@/lib/definitions";
import { folderDeleteAndUpdateSizes } from "@/lib/prismaExtend";

export async function getLightFolders(): Promise<{
    lightFolders: LightFolder[],
    error?: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { lightFolders: [], error: "You must be logged in to create a folders" };
    }

    const folders = await prisma.folder.findMany({
        where: {
            createdBy: {
                id: session.user.id as string
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
    const session = await auth();

    if (!session?.user) {
        return { folder: null, error: "You must be logged in to get folder name" };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: id,
            createdBy: {
                id: session.user.id as string
            }
        },
        select: {
            id: true,
            name: true
        }
    });

    return { folder: folder, error: null }
}

export async function createFolder(name: string): Promise<{
    folder: { id: string; name: string; coverId: string | null; createdById: string; createdAt: Date; updatedAt: Date; } | null,
    error: string | null,
}> {
    const session = await auth();

    if (!session?.user) {
        return { folder: null, error: "You must be logged in to create a folders" };
    }

    const readToken = crypto.randomUUID();
    const writeToken = crypto.randomUUID();
    const folder = await prisma.folder.create({
        data: {
            name: name,
            createdBy: {
                connect: {
                    id: session.user.id as string
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

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return { folder: folder, error: null };
}

export async function renameFolder(folderId: string, name: string): Promise<{
    folder: { id: string; name: string; coverId: string | null; createdById: string; createdAt: Date; updatedAt: Date; } | null,
    error: string | null,
}> {
    const session = await auth();

    if (!session?.user) {
        return { folder: null, error: "You must be logged in to rename a folders" };
    }

    const folder = await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id as string
            }
        },
        data: {
            name: name,
        }
    });

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return { folder: folder, error: null };
}

export async function changeFolderCover(folderId: string, coverId: string): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to change a folder's cover" };
    }

    await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id as string
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

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/folders");
    return { error: null }
}

export async function lockFolder(folderId: string, pin: string): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to lock a folder" };
    }

    try {
        LockFolderFormSchema.safeParse({ pin: pin });
    } catch (e: any) {
        return { error: "invalid-pin" };
    }

    await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id as string
            }
        },
        data: {
            locked: true,
            lockCode: pin
        }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/folders");
    return { error: null }
}

export async function unlockFolder(folderId: string): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to unlock a folder" };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id as string
            }
        }
    });

    if (!folder) {
        return { error: "folder-not-found" };
    }

    await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id as string
            }
        },
        data: {
            locked: false,
            lockCode: null
        }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/folders");
    return { error: null }
}

export async function deleteFolder(folderId: string): Promise<any> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to delete a folders" };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: { id: session.user.id as string }
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

    fs.rm(process.cwd() + "/drive/" + folderId, { recursive: true, force: true}, (err: any) => {
        if (err) {
            console.error("Error deleting folder", err);
        }
    });

    await folderDeleteAndUpdateSizes(folderId, session.user.id as string);

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return { error: null };
}
