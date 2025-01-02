"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "./auth";
import { FolderTokenPermission, PersonAccessToken } from "@prisma/client";

export async function getPersonAccessTokens(): Promise<{
    error: string | null,
    personAccessTokens: PersonAccessToken[]
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

    return { error: null }
}