import { PersonAccessToken } from "@prisma/client";
import { AccessToken } from "@prisma/client";
import { prisma } from "./prisma";
import { getCurrentSession } from "./session";
import * as bcrypt from "bcryptjs";

export async function hasFolderOwnerAccess(folderId: string): Promise<boolean> {
    const { user } = await getCurrentSession();

    if (user) {
        const folder = await prisma.folder.findUnique({
            where: { id: folderId, createdBy: { id: user.id } }
        });

        if (folder) {
            return true;
        }
    }

    return false;
}

/**
 * Returns 1 for access granted
 * 2 if a code is needed
 * 3 if the code is wrong
 * 0 if unauthorized
 * @param folderId 
 * @param shareToken 
 * @param accessKey 
 * @param tokenType 
 * @returns 
 */
export async function isAllowedToAccessFolder(folderId: string, shareToken?: string | null, accessKey?: string | null, tokenType?: string | null): Promise<number> {
    const { user } = await getCurrentSession();

    if (user) {
        const folder = await prisma.folder.findUnique({
            where: { id: folderId, createdBy: { id: user.id } }
        });

        if (folder) {
            return 1;
        }
    }

    if (shareToken) {
        let access;
        if (tokenType === "p") {
            access = await prisma.personAccessToken.findUnique({
                where: { token: shareToken },
                include: {
                    folder: { select: { id: true } }
                },
                omit: { pinCode: false }
            });
        } else {
            access = await prisma.accessToken.findUnique({
                where: {token: shareToken },
                include: {
                    folder: { select: { id: true } }
                },
                omit: { pinCode: false }
            });
        }

        if (!access) {
            return 0;
        }

        if (access.locked && access.pinCode) {
            if (!accessKey) {
                return 2;
            }

            const match = bcrypt.compareSync(access.pinCode as string, accessKey || "");

            if (!match) {
                return 3;
            }
        }

        return 1;
    }

    return 0;
}

export async function isAllowedToAccessFile(fileId: string, shareToken?: string | null, accessKey?: string | null, tokenType?: string | null): Promise<boolean> {
    const { user } = await getCurrentSession();

    if (user) {
        const file = await prisma.file.findUnique({
            where: {
                id: fileId,
                createdBy: { id: user.id }
            }
        });

        if (file) {
            return true;
        }
    }

    if (shareToken) {
        let access;
        if (tokenType === "p") {
            access = await prisma.personAccessToken.findUnique({
                where: {
                    token: shareToken
                },
                include: {
                    folder: {
                        select: {
                            id: true
                        }
                    }
                },
                omit: {
                    pinCode: false
                }
            });
        } else {
            access = await prisma.accessToken.findUnique({
                where: {
                    token: shareToken
                },
                include: {
                    folder: {
                        select: {
                            id: true
                        }
                    }
                },
                omit: {
                    pinCode: false
                }
            });
        }

        if (!access) {
            return false;
        }

        if (access.locked && access.pinCode) {
            if (!accessKey) {
                return false;
            }

            const match = bcrypt.compareSync(access.pinCode as string, accessKey || "");

            if (!match) {
                return false;
            }
        }

        return true;
    }

    return false;
}

export async function isAllowedToDeleteComment(commentId: string, shareToken?: string | null, accessKey?: string | null, tokenType?: "accessToken" | "personAccessToken" | null) {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { file: { select: { id: true } } }
    });

    if (!comment) {
        return false;
    }

    if (comment.createdById) {
        const { user } = await getCurrentSession();

        if (!user) {
            return false;
        }

        return comment.createdById === user.id;
    }

    if (comment.createdByEmail) {
        if (!shareToken || !isAllowedToAccessFile(comment.fileId, shareToken, accessKey, tokenType) || tokenType !== "personAccessToken") {
            return false;
        }

        const token = await getToken(shareToken, "personAccessToken") as PersonAccessToken;

        if (!token || !token.email) {
            return false;
        }

        return token.email === comment.createdByEmail;
    }

    return false;
}

export async function canLikeFile(fileId: string, shareToken?: string | null, accessKey?: string | null, tokenType?: "accessToken" | "personAccessToken" | null) {
    // Only email-shared people and owners can like files
    return await isAllowedToAccessFile(fileId, shareToken, accessKey, "personAccessToken");
}

export async function canLikeComment(commentId: string, shareToken?: string | null, accessKey?: string | null, tokenType?: "accessToken" | "personAccessToken" | null) {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { file: { select: { id: true, folderId: true } } }
    });

    if (!comment) {
        return false;
    }

    const { user } = await getCurrentSession();

    if (user) {
        return isAllowedToAccessFile(comment.fileId);
    }

    if (!shareToken || tokenType !== "personAccessToken") {
        return false;
    }

    const token = await getToken(shareToken, "personAccessToken");

    if (!token) {
        return false;
    }

    return isAllowedToAccessFile(comment.fileId, shareToken, accessKey, "personAccessToken");
}

export async function getToken(shareToken: string, tokenType: "accessToken" | "personAccessToken"): Promise<AccessToken | PersonAccessToken | null> {
    if (tokenType === "accessToken") {
        return await prisma.accessToken.findUnique({ where: { token: shareToken } });
    } else {
        return await prisma.personAccessToken.findUnique({ where: { token: shareToken } });
    }
}
