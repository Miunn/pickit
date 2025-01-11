"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "@/actions/auth";
import { AccessTokenWithFolder, CreateAccessTokenFormSchema, ImageLightWithFolderName, ImageWithFolder } from "@/lib/definitions";
import { revalidatePath } from "next/cache";
import { AccessToken, FolderTokenPermission } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function getAccessTokens(): Promise<{
    error: string | null,
    accessTokens: AccessTokenWithFolder[]
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to get links", accessTokens: [] }
    }

    const links = await prisma.accessToken.findMany({
        where: {
            folder: {
                createdBy: {
                    id: session.user.id
                }
            }
        },
        include: {
            folder: true
        },
        orderBy: [
            {
                folder: {
                    name: "asc"
                }
            }
        ]
    });

    return { error: null, accessTokens: links }
}

export async function createNewAccessToken(folderId: string, permission: FolderTokenPermission, expiryDate: Date): Promise<{
    error: string | null,
    accessToken?: AccessToken
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to create a new access token" }
    }

    try {
        CreateAccessTokenFormSchema.safeParse({
            folderId,
            permission,
            expiryDate
        });
    } catch (e: any) {
        return { error: e.message };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id
            }
        }
    });

    if (!folder) {
        return { error: "Folder doesn't exist or you don't have the rights to create an access token for this folder" }
    }

    const token = crypto.randomUUID();
    try {
        const accessToken = await prisma.accessToken.create({
            data: {
                folder: {
                    connect: {
                        id: folderId
                    }
                },
                token: token,
                permission: permission,
                expires: expiryDate
            }
        });
        revalidatePath("/dashboard/links");
        revalidatePath("/dashboard/folders/[folderId]");
        return { error: null, accessToken: accessToken }
    } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
            if (e.code === "P2025") {
                return { error: "Provided folder can't be found in database" }
            }
        }
        return { error: "Unknow error happened when trying to create accesss token" }
    }
}

export async function changeAccessTokenActiveState(token: string, isActive: boolean): Promise<{
    error: string | null,
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to change token state" }
    }

    await prisma.accessToken.update({
        where: {
            token: token,
            folder: {
                createdBy: {
                    id: session.user.id
                }
            }
        },
        data: {
            isActive: isActive
        }
    });

    revalidatePath("/dashboard/links");
    return { error: null }
}

export async function lockAccessToken(tokenId: string, pin: string): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to lock an access token" }
    }

    try {
        const token = await prisma.accessToken.findFirst({
            where: {
                id: tokenId,
                folder: {
                    createdBy: {
                        id: session.user.id
                    }
                }
            }
        });

        if (!token) {
            return { error: "Token not found" }
        }

        await prisma.accessToken.update({
            where: {
                id: tokenId
            },
            data: {
                locked: true,
                pinCode: pin
            }
        });

        revalidatePath("/dashboard/links");
        return { error: null }
    } catch (e) {
        return { error: "An unknown error happened when trying to lock this token" }
    }
}

export async function unlockAccessToken(tokenId: string): Promise<{
    error: string | null
}> {
    console.log("Ask for unlock");
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to unlock an access token" }
    }

    try {
        const token = await prisma.accessToken.findFirst({
            where: {
                id: tokenId,
                folder: {
                    createdBy: {
                        id: session.user.id
                    }
                }
            }
        });

        if (!token) {
            console.log("Token not found");
            return { error: "Token not found" }
        }

        await prisma.accessToken.update({
            where: {
                id: tokenId
            },
            data: {
                locked: false,
                pinCode: null
            }
        });

        console.log("Unlocked");
        revalidatePath("/dashboard/links");
        return { error: null }
    } catch (e) {
        console.log("Error", e);
        return { error: "An unknown error happened when trying to unlock this token" }
    }
}

export async function deleteAccessToken(tokens: string[]): Promise<{ error: string | null }> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to delete an access token" }
    }

    try {
        await prisma.accessToken.deleteMany({
            where: {
                token: {
                    in: tokens
                },
                folder: {
                    createdBy: {
                        id: session.user.id
                    }
                }
            }
        })
    } catch (e) {
        return { error: "An unknown error happened when trying to delete this access token" }
    }

    revalidatePath("/dashboard/links");
    return { error: null }
}