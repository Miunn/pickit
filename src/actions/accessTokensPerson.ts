"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "./auth";
import { FolderTokenPermission, PersonAccessToken } from "@prisma/client";
import { PersonAccessTokenWithFolder } from "@/lib/definitions";
import { revalidatePath } from "next/cache";
import { sendShareFolderEmail } from "@/lib/mailing";

export async function getPersonsAccessTokens(): Promise<{
    error: string | null,
    personAccessTokens: PersonAccessTokenWithFolder[]
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "unauthorized", personAccessTokens: [] }
    }

    const personAccessTokens = await prisma.personAccessToken.findMany({
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

    return { error: null, personAccessTokens }
}

export async function createNewPersonAccessToken(folderId: string, target: string, permission: FolderTokenPermission, expiryDate: Date): Promise<{
    error: string | null,
    personAccessToken?: PersonAccessToken
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "unauthorized" }
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
        return { error: "folder-not-found" };
    }

    const token = crypto.randomUUID();
    const personAccessToken = await prisma.personAccessToken.create({
        data: {
            token,
            email: target,
            folder: {
                connect: {
                    id: folderId
                }
            },
            permission,
            expires: expiryDate
        }
    });

    return { error: null, personAccessToken }
}

export async function createMultiplePersonAccessTokens(folderId: string, data: { email: string, permission: FolderTokenPermission, expiryDate: Date }[]): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "unauthorized" }
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
        return { error: "folder-not-found" };
    }

    const tokens = data.map(() => crypto.randomUUID());
    await prisma.personAccessToken.createMany({
        data: data.map((d, i) => ({
            token: tokens[i],
            email: d.email,
            folderId,
            permission: d.permission,
            expires: d.expiryDate
        }))
    });

    await sendShareFolderEmail(data.map((d, i) => ({ email: d.email, link: `${process.env.NEXTAUTH_URL}/dashboard/folders/${folderId}?share=${tokens[i]}&t=p`})), session.user.name!, folder.name)
    return { error: null }
}

export async function lockPersonAccessToken(tokenId: string, pin: string): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to lock an access token" }
    }

    try {
        const token = await prisma.personAccessToken.findFirst({
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

        await prisma.personAccessToken.update({
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

export async function unlockPersonAccessToken(tokenId: string): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to unlock an access token" }
    }

    try {
        const token = await prisma.accessToken.findFirst({
            where: {
                token: tokenId,
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
                token: tokenId
            },
            data: {
                locked: false,
                pinCode: null
            }
        });

        revalidatePath("/dashboard/links");
        return { error: null }
    } catch (e) {
        return { error: "An unknown error happened when trying to unlock this token" }
    }
}