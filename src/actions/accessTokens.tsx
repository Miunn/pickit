"use server"

import { prisma } from "@/lib/prisma";
import { AccessTokenWithFolder, CreateAccessTokenFormSchema, FileLightWithFolderName, FileWithFolder } from "@/lib/definitions";
import { revalidatePath } from "next/cache";
import { AccessToken, FolderTokenPermission } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getCurrentSession } from "@/lib/session";
import { transporter } from "@/lib/mailing";
import { render } from "@react-email/components";
import ShareFolderTemplate from "@/components/emails/ShareFolderTemplate";
import NotifyAboutUploadTemplate from "@/components/emails/NotifyAboutUpload";

export async function createNewAccessToken(folderId: string, permission: FolderTokenPermission, expiryDate: Date): Promise<{
    error: string | null,
    accessToken?: AccessToken
}> {
    const { user } = await getCurrentSession();

    if (!user) {
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
                id: user.id
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
        revalidatePath("/app/links");
        revalidatePath("/app/folders/[folderId]");
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

export async function createMultipleAccessTokens(folderId: string, tokens: { email: string, permission: FolderTokenPermission, expiryDate: Date, pinCode?: string, allowMap?: boolean }[]): Promise<{
    error: string | null
}> {
    const errors: string[] = [];
    tokens.forEach(async (token) => {
        const r = await createNewAccessToken(folderId, token.permission, token.expiryDate);
        if (r.error) errors.push(r.error);
    });

    if (errors.length > 0) {
        return { error: errors.join(", ") }
    }

    return { error: null }
}

export async function changeAccessTokenActiveState(token: string, isActive: boolean): Promise<{
    error: string | null,
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to change token state" }
    }

    await prisma.accessToken.update({
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

    revalidatePath("/app/links?s=links");
    return { error: null }
}

export async function changeAccessTokenAllowMap(tokenId: string, allowMap: boolean): Promise<{error: string | null}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to change the allow map state of an access token" }
    }

    try {
        await prisma.accessToken.update({
            where: {
                id: tokenId,
                folder: { createdBy: { id: user.id } }
            },
            data: { allowMap }
        });
        revalidatePath("/app/links");
        return { error: null }
    } catch (e) {
        return { error: "An unknown error happened when trying to change the allow map state of this access token" }
    }
}

export async function lockAccessToken(tokenId: string, pin: string): Promise<{
    error: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to lock an access token" }
    }

    try {
        const token = await prisma.accessToken.findFirst({
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

        await prisma.accessToken.update({
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

export async function unlockAccessToken(tokenId: string): Promise<{
    error: string | null
}> {
    console.log("Ask for unlock");
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to unlock an access token" }
    }

    try {
        const token = await prisma.accessToken.findFirst({
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
        revalidatePath("/app/links");
        return { error: null }
    } catch (e) {
        console.log("Error", e);
        return { error: "An unknown error happened when trying to unlock this token" }
    }
}

export async function deleteAccessToken(tokens: string[]): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
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
                        id: user.id
                    }
                }
            }
        })
    } catch (e) {
        return { error: "An unknown error happened when trying to delete this access token" }
    }

    revalidatePath("/app/links");
    return { error: null }
}

export async function sendAgainAccessToken(token: string) {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to send an access token again" }
    }

    const accessToken = await prisma.accessToken.findFirst({
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

    if (!accessToken || !accessToken.email) {
        return { error: "Token not found" }
    }

    await sendShareFolderEmail([{ email: accessToken.email, link: `${process.env.NEXT_PUBLIC_APP_URL}/app/folders/${accessToken.folderId}?share=${token}&t=p`, locked: accessToken.locked }], user.name!, accessToken.folder.name)

    return { error: null }
}

export async function notifyAboutUpload(folderId: string, count: number) {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to notify about an upload" }
    }

    const folder = await prisma.folder.findUnique({
        where: { id: folderId, createdBy: { id: user.id } },
        include: { accessTokens: true }
    });

    if (!folder) {
        return { error: "Folder not found" }
    }

    const personAccessTokens = folder.accessTokens.filter((p) => p.email).map((p) => ({
        email: p.email!,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/app/folders/${folderId}?share=${p.token}&t=p`,
        locked: p.locked
    }));

    await sendNotifyAboutUploadEmail(personAccessTokens, user.name!, folder.name, count);
}

async function sendShareFolderEmail(data: { email: string, link: string, locked: boolean, message?: string }[], name: string, folderName: string) {
    data.forEach(async (d) => {
        const content = await render(<ShareFolderTemplate name={name} folderName={folderName} link={d.link} isLocked={d.locked} message={d.message} />);

        await transporter.sendMail({
            from: `"The Echomori Team" <${process.env.MAIL_SENDER}>`,
            to: d.email,
            subject: "You've been shared a folder",
            text: "You've been shared a folder",
            html: content,
        })
    });
}

async function sendNotifyAboutUploadEmail(data: { email: string, link: string, locked: boolean }[], name: string, folderName: string, count: number) {
    data.forEach(async (d) => {
        const content = await render(<NotifyAboutUploadTemplate name={name} folderName={folderName} link={d.link} isLocked={d.locked} count={count} lang="fr" />);

        await transporter.sendMail({
            from: `"The Echomori Team" <${process.env.MAIL_SENDER}>`,
            to: d.email,
            subject: "Nouveaux fichiers ajoutés à " + folderName,
            text: "Nouveaux fichiers ajoutés à " + folderName,
            html: content,
        })
    });
}