"use server"

import { prisma } from "@/lib/prisma";
import { FolderTokenPermission, PersonAccessToken } from "@prisma/client";
import { PersonAccessTokenWithFolder } from "@/lib/definitions";
import { revalidatePath } from "next/cache";
import { transporter } from "@/lib/mailing";
import { getCurrentSession } from "@/lib/authUtils";
import ShareFolderTemplate from "@/components/emails/ShareFolderTemplate";

export async function getPersonsAccessTokens(): Promise<{
    error: string | null,
    personAccessTokens: PersonAccessTokenWithFolder[]
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "unauthorized", personAccessTokens: [] }
    }

    const personAccessTokens = await prisma.personAccessToken.findMany({
        where: {
            folder: {
                createdBy: {
                    id: user.id
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
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "unauthorized" }
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: {
                id: user.id
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
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "unauthorized" }
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: {
                id: user.id
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

    await sendShareFolderEmail(data.map((d, i) => ({ email: d.email, link: `${process.env.APP_URL}/app/folders/${folderId}?share=${tokens[i]}&t=p`, locked: false })), user.name!, folder.name)
    return { error: null }
}

export async function changePersonAccessTokenActiveState(token: string, isActive: boolean): Promise<{
    error: string | null,
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to change token state" }
    }

    await prisma.personAccessToken.update({
        where: {
            token: token,
            folder: {
                createdBy: {
                    id: user.id
                }
            }
        },
        data: {
            isActive: isActive
        }
    });

    revalidatePath("/app/links");
    return { error: null }
}

export async function lockPersonAccessToken(tokenId: string, pin: string): Promise<{
    error: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to lock an access token" }
    }

    try {
        const token = await prisma.personAccessToken.findFirst({
            where: {
                id: tokenId,
                folder: {
                    createdBy: {
                        id: user.id
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

        revalidatePath("/app/links");
        return { error: null }
    } catch (e) {
        return { error: "An unknown error happened when trying to lock this token" }
    }
}

export async function unlockPersonAccessToken(tokenId: string): Promise<{
    error: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to unlock an access token" }
    }

    try {
        const token = await prisma.accessToken.findFirst({
            where: {
                token: tokenId,
                folder: {
                    createdBy: {
                        id: user.id
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

        revalidatePath("/app/links");
        return { error: null }
    } catch (e) {
        return { error: "An unknown error happened when trying to unlock this token" }
    }
}

export async function deletePersonAccessTokens(tokens: string[]): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to delete an access token" }
    }

    try {
        await prisma.personAccessToken.deleteMany({
            where: {
                token: {
                    in: tokens
                },
                folder: {
                    createdBy: {
                        id: user.id
                    }
                }
            }
        })
    } catch (e) {
        return { error: "An unknown error happened when trying to delete access tokens" }
    }

    revalidatePath("/app/links");
    return { error: null }
}

export async function sendAgainPersonAccessToken(token: string) {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to send an access token again" }
    }

    const personAccessToken = await prisma.personAccessToken.findFirst({
        where: {
            token: token,
            folder: {
                createdBy: {
                    id: user.id
                }
            }
        },
        include: {
            folder: {
                select: {
                    name: true
                }
            }
        }
    });

    if (!personAccessToken) {
        return { error: "Token not found" }
    }

    await sendShareFolderEmail([{ email: personAccessToken.email, link: `${process.env.APP_URL}/app/folders/${personAccessToken.folderId}?share=${token}&t=p`, locked: personAccessToken.locked }], user.name!, personAccessToken.folder.name)

    return { error: null }
}

async function sendShareFolderEmail(data: { email: string, link: string, locked: boolean }[], name: string, folderName: string) {
    const ReactDOMServer = (await import('react-dom/server')).default;

    data.forEach(async (d) => {
        const content = ReactDOMServer.renderToString(<ShareFolderTemplate name={name} folderName={folderName} link={d.link} isLocked={d.locked} />);

        await transporter.sendMail({
            from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
            to: d.email,
            subject: "You've been shared a folder",
            text: "You've been shared a folder",
            html: content,
        })
    });
}