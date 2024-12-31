import { prisma } from "@/lib/prisma";
import { auth } from "./auth";
import { PersonAccessToken } from "@prisma/client";

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