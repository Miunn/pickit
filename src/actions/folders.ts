"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "@/actions/auth";
import * as fs from "fs";
import { revalidatePath } from "next/cache";
import { FolderWithAccessToken, FolderWithImagesWithFolder, LightFolder, LockFolderFormSchema } from "@/lib/definitions";
import { folderDeleteAndUpdateSizes } from "@/lib/prismaExtend";
import * as bcrypt from "bcryptjs";

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

export async function getFolderFull(folderId: string, shareToken?: string, tokenType?: "accessToken" | "personAccessToken", hashedPinCode?: string): Promise<{
    error: string | null,
    folder: (FolderWithImagesWithFolder & FolderWithAccessToken) | null
}> {
    const session = await auth();

    if (!session?.user && !shareToken) {
        return { error: "unauthorized", folder: null };
    }

    if (!session?.user && shareToken) {
        let accessToken;
        if (tokenType === "accessToken") {
            accessToken = await prisma.accessToken.findUnique({
                where: {
                    token: shareToken,
                    folderId: folderId,
                    expires: {
                        gte: new Date()
                    }
                },
                include: {
                    folder: {
                        include: {
                            images: {
                                include: {
                                    folder: true
                                }
                            },
                        }
                    }
                },
                omit: {
                    pinCode: false
                }
            });
        } else if (tokenType === "personAccessToken") {
            accessToken = await prisma.personAccessToken.findUnique({
                where: {
                    token: shareToken,
                    folderId: folderId,
                    expires: {
                        gte: new Date()
                    }
                },
                include: {
                    folder: {
                        include: {
                            images: {
                                include: {
                                    folder: true
                                }
                            },
                        }
                    }
                },
                omit: {
                    pinCode: false
                }
            });
        } else {
            return { error: "invalid-token-type", folder: null };
        }

        if (!accessToken) {
            return { error: "unauthorized", folder: null };
        }

        if (accessToken.locked && !hashedPinCode) {
            return { error: "code-needed", folder: null };
        }

        if (accessToken.locked) {
            if (!hashedPinCode) {
                return { error: "unauthorized", folder: null };
            }

            const match = bcrypt.compareSync(accessToken.pinCode as string, hashedPinCode);

            if (!match) {
                return { error: "unauthorized", folder: null };
            }
        }

        return { error: null, folder: {...accessToken.folder, AccessToken: []} };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: {
                id: session?.user?.id
            }
        },
        include: {
            images: {
                include: {
                    folder: true
                }
            },
            AccessToken: true
        }
    });

    return { error: null, folder: folder };
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

    fs.rm(process.cwd() + "/drive/" + folderId, { recursive: true, force: true }, (err: any) => {
        if (err) {
            console.error("Error deleting folder", err);
        }
    });

    await folderDeleteAndUpdateSizes(folderId, session.user.id as string);

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return { error: null };
}
