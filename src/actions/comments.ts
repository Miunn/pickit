'use server'

import { CommentWithCreatedBy, CreateCommentFormSchema, FolderWithAccessToken, FolderWithCreatedBy, FolderWithFilesWithFolderAndCommentsAndCreatedBy, FolderWithPersonAccessToken } from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { isAllowedToDeleteComment } from "@/lib/dal";
import { EditCommentFormSchema } from "@/lib/definitions";

export async function createComment(
    fileId: string,
    data: z.infer<typeof CreateCommentFormSchema>,
    shareToken?: string | null,
    type?: "accessToken" | "personAccessToken" | null,
    h?: string | null
): Promise<CommentWithCreatedBy | null> {
    const { user } = await getCurrentSession();

    if (!user && (!shareToken || !type)) {
        return null;
    }

    let file;
    file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
            folder: {
                include: {
                    files: { include: { folder: true, comments: { include: { createdBy: true } } } },
                    createdBy: true,
                    AccessToken: { omit: { pinCode: false } },
                    PersonAccessToken: { omit: { pinCode: false } }
                }
            }
        }
    });

    if (!file) {
        return null;
    }

    const folder: FolderWithFilesWithFolderAndCommentsAndCreatedBy & FolderWithAccessToken & FolderWithPersonAccessToken = file.folder;
    let commentName = "Anonymous";
    let createdByEmail = null;

    if (!user || folder.createdById !== user.id) {
        if (!shareToken || !type || (type !== "accessToken" && type !== "personAccessToken")) {
            return null;
        }

        if (type === "personAccessToken") {
            const accessToken = folder.PersonAccessToken.find(a => a.token === shareToken && a.expires >= new Date());

            if (!accessToken) {
                return null;
            }

            if (accessToken.locked) {
                if (!h) {
                    return null;
                }

                const match = bcrypt.compareSync(accessToken.pinCode as string, h);

                if (!match) {
                    return null;
                }
            }
            commentName = accessToken.email.split("@")[0];
            createdByEmail = accessToken.email;
        } else {
            const accessToken = folder.AccessToken.find(a => a.token === shareToken && a.expires >= new Date());

            if (!accessToken) {
                return null;
            }

            if (accessToken.locked) {
                if (!h) {
                    return null;
                }

                const match = bcrypt.compareSync(accessToken.pinCode as string, h);

                if (!match) {
                    return null;
                }
            }
        }
    } else {
        commentName = user.name;
        createdByEmail = user.email;
    }

    const parsedData = CreateCommentFormSchema.safeParse(data);

    if (!parsedData.success) {
        return null;
    }

    try {
        let data;
        if (user) {
            data = {
                text: parsedData.data.content,
                createdBy: { connect: { id: user?.id } },
                createdByEmail,
                name: commentName,
                file: { connect: { id: fileId } }
            }
        } else {
            data = {
                text: parsedData.data.content,
                name: commentName,
                createdByEmail,
                file: { connect: { id: fileId } }
            }
        }

        const comment = await prisma.comment.create({
            data,
            include: { file: { include: { folder: true } }, createdBy: true }
        });

        if (!comment) {
            console.log("Comment creation failed");
            return null;
        }

        revalidatePath(`/app/folders/${folder.id}`);
        return comment;
    } catch (e) {
        console.log("Error creating comment", e);
        return null;
    }
}

export async function deleteComment(commentId: string, shareToken?: string | null, accessKey?: string | null, tokenType?: "accessToken" | "personAccessToken" | null) {
    const isAllowed = await isAllowedToDeleteComment(commentId, shareToken, accessKey, tokenType);

    if (!isAllowed) {
        return false;
    }

    try {
        const comment = await prisma.comment.delete({ where: { id: commentId }, include: { file: { include: { folder: { select: { id: true } } } } } });

        if (!comment) {
            return false;
        }

        revalidatePath(`/app/folders/${comment.file.folder.id}`);
        return true;
    } catch (e) {
        console.log("Error deleting comment", e);
        return false;
    }
}

export async function updateComment(
    commentId: string,
    text: string,
    shareToken?: string | null,
    accessKey?: string | null,
    tokenType?: "accessToken" | "personAccessToken" | null
): Promise<CommentWithCreatedBy | null> {
    const isAllowed = await isAllowedToDeleteComment(commentId, shareToken, accessKey, tokenType);

    if (!isAllowed) {
        return null;
    }

    const result = EditCommentFormSchema.safeParse({ content: text });
    if (!result.success) {
        return null;
    }

    try {
        const comment = await prisma.comment.update({
            where: { id: commentId },
            data: { text: result.data.content },
            include: { file: { include: { folder: { select: { id: true } } } }, createdBy: true }
        });

        if (!comment) {
            return null;
        }

        revalidatePath(`/app/folders/${comment.file.folder.id}`);
        return comment;
    } catch (e) {
        console.log("Error updating comment", e);
        return null;
    }
}