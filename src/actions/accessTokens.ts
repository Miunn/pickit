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