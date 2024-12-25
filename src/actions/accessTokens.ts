"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "@/actions/auth";
import { AccessTokenWithFolder, CreateAccessTokenFormSchema, ImageLightWithFolderName, ImageWithFolder } from "@/lib/definitions";
import { revalidatePath } from "next/cache";
import { FolderTokenPermission } from "@prisma/client";
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
    error: string | null
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

    const token = crypto.randomUUID();
    try {
        await prisma.accessToken.create({
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
        return { error: null }
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
            token: token
        },
        data: {
            isActive: isActive
        }
    });

    revalidatePath("/dashboard/links");
    return { error: null }
}

export async function deleteAccessToken(tokens: string[]): Promise<{ error: string | null }> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to delete an access token" }
    }

    console.log("Deleting tokens", tokens);
    try {
        await prisma.accessToken.deleteMany({
            where: {
                token: {
                    in: tokens
                }
            }
        })
    } catch (e) {
        console.log("Error while deleting access token", e);
        return { error: "An unknown error happened when trying to delete this access token" }
    }

    revalidatePath("/dashboard/links");
    return { error: null }
}