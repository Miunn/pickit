"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "@/actions/auth";
import { AccessTokenWithFolder, ImageLightWithFolderName, ImageWithFolder } from "@/lib/definitions";
import { revalidatePath } from "next/cache";

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

export async function deleteAccessToken(token: string): Promise<{ error: string | null}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to delete an access token" }
    }

    await prisma.accessToken.delete({
        where: {
            token: token
        }
    })

    revalidatePath("/dashboard/links");
    return { error: null }
}