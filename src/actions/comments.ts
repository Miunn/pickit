"use server";

import {
    CommentWithCreatedBy,
    CreateCommentFormSchema,
    FolderWithAccessToken,
    FolderWithFilesWithFolderAndCommentsAndCreatedBy,
} from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { isAllowedToDeleteComment } from "@/lib/dal";
import { EditCommentFormSchema } from "@/lib/definitions";
import { FileService } from "@/data/file-service";
import { CommentService } from "@/data/comment-service";

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

    const file = await FileService.get({
        where: { id: fileId },
        include: {
            folder: {
                include: {
                    files: { include: { folder: true, comments: { include: { createdBy: true } } } },
                    createdBy: true,
                    accessTokens: { omit: { pinCode: false } },
                },
            },
        },
    });

    if (!file) {
        return null;
    }

    const folder: FolderWithFilesWithFolderAndCommentsAndCreatedBy & FolderWithAccessToken = file.folder;
    let commentName = "Anonymous";
    let createdByEmail = null;

    if (!user || folder.createdById !== user.id) {
        if (!shareToken || !type || (type !== "accessToken" && type !== "personAccessToken")) {
            return null;
        }

        const accessToken = folder.accessTokens.find(a => a.token === shareToken && a.expires >= new Date());
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

        if (accessToken.email) {
            commentName = accessToken.email.split("@")[0];
            createdByEmail = accessToken.email;
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
                file: { connect: { id: fileId } },
            };
        } else {
            data = {
                text: parsedData.data.content,
                name: commentName,
                createdByEmail,
                file: { connect: { id: fileId } },
            };
        }

        const comment = await CommentService.create(data, { file: { include: { folder: true } }, createdBy: true });

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

export async function deleteComment(commentId: string, shareToken?: string | null, accessKey?: string | null) {
    const isAllowed = await isAllowedToDeleteComment(commentId, shareToken, accessKey);

    if (!isAllowed) {
        return false;
    }

    try {
        const comment = await CommentService.delete({
            commentId,
            include: { file: { select: { folderId: true } } },
        });

        if (!comment) {
            return false;
        }

        revalidatePath(`/app/folders/${comment.file.folderId}`);
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
    accessKey?: string | null
): Promise<CommentWithCreatedBy | null> {
    const isAllowed = await isAllowedToDeleteComment(commentId, shareToken, accessKey);

    if (!isAllowed) {
        return null;
    }

    const result = EditCommentFormSchema.safeParse({ content: text });
    if (!result.success) {
        return null;
    }

    try {
        const comment = await CommentService.update(
            commentId,
            { text: result.data.content },
            { file: { include: { folder: { select: { id: true } } } }, createdBy: true }
        );

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
