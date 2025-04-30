import { prisma } from "./prisma";
import { getCurrentSession } from "./session";
import * as bcrypt from "bcryptjs";

export async function isAllowedToAccessFolder(folderId: string, shareToken?: string | null, accessKey?: string | null, tokenType?: string | null): Promise<boolean> {
    const { user } = await getCurrentSession();

    if (user) {
        const folder = await prisma.folder.findUnique({
            where: { id: folderId, createdBy: { id: user.id } }
        });

        if (folder) {
            return true;
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
