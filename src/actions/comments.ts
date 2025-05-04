'use server'

import { CreateCommentFormSchema, FolderWithAccessToken, FolderWithCreatedBy, FolderWithFilesWithFolderAndCommentsAndCreatedBy, FolderWithPersonAccessToken } from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

export async function createComment(
    fileId: string,
    data: z.infer<typeof CreateCommentFormSchema>,
    shareToken?: string | null,
    type?: "accessToken" | "personAccessToken" | null,
    h?: string | null
): Promise<boolean> {
    const { user } = await getCurrentSession();

    if (!user && (!shareToken || !type)) {
        return false;
    }

    let file;
        file =  await prisma.file.findUnique({
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
        return false;
    }

    const folder: FolderWithFilesWithFolderAndCommentsAndCreatedBy & FolderWithAccessToken & FolderWithPersonAccessToken = file.folder;
    let commentName = "Anonymous";
    let createdByEmail = null;

    if (!user || folder.createdById !== user.id) {
        if (!shareToken || !type || (type !== "accessToken" && type !== "personAccessToken")) {
            return false;
        }

        if (type === "personAccessToken") {
            const accessToken = folder.PersonAccessToken.find(a => a.token === shareToken && a.expires >= new Date());

            if (!accessToken) {
                return false;
            }

            if (accessToken.locked) {
                if (!h) {
                    return false;
                }

                const match = bcrypt.compareSync(accessToken.pinCode as string, h);

                if (!match) {
                    return false;
                }
            }
            commentName = accessToken.email.split("@")[0];
            createdByEmail = accessToken.email;
        } else {
            const accessToken = folder.AccessToken.find(a => a.token === shareToken && a.expires >= new Date());

            if (!accessToken) {
                return false;
            }

            if (accessToken.locked) {
                if (!h) {
                    return false;
                }

                const match = bcrypt.compareSync(accessToken.pinCode as string, h);

                if (!match) {
                    return false;
                }
            }
        }
    } else {
        commentName = user.name;
        createdByEmail = user.email;
    }

    const parsedData = CreateCommentFormSchema.safeParse(data);

    if (!parsedData.success) {
        return false;
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
            include: { file: { include: { folder: true } } }
        });
        
        if (!comment) {
            console.log("Comment creation failed");
            return false;
        }

        revalidatePath(`/app/folders/${folder.id}`);
        return true;
    } catch (e) {
        console.log("Error creating comment", e);
        return false;
    }
}

export async function deleteComment(commentId: string) {

}