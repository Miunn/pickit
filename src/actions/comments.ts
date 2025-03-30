'use server'

import { CreateCommentFormSchema, FolderWithAccessToken, FolderWithCreatedBy, FolderWithImagesWithFolderAndComments, FolderWithPersonAccessToken } from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

export async function createComment(
    fileId: string,
    fileType: "image" | "video",
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
    if (fileType === "image") {
        file =  await prisma.image.findUnique({
            where: { id: fileId },
            include: {
                folder: {
                    include: {
                        images: { include: { folder: true, comments: { include: { createdBy: true } } } },
                        createdBy: true,
                        AccessToken: { omit: { pinCode: false } },
                        PersonAccessToken: { omit: { pinCode: false } }
                    }
                }
            }
        });
    } else if (fileType === "video") {
        file = await prisma.video.findUnique({
            where: { id: fileId },
            include: {
                folder: {
                    include: {
                        images: { include: { folder: true, comments: { include: { createdBy: true } } } },
                        createdBy: true,
                        AccessToken: { omit: { pinCode: false } },
                        PersonAccessToken: { omit: { pinCode: false } }
                    }
                }
            }
        });
    }

    if (!file) {
        console.log("File not found");
        return false;
    }

    const folder: FolderWithImagesWithFolderAndComments & FolderWithCreatedBy & FolderWithAccessToken & FolderWithPersonAccessToken = file.folder;
    let commentName = "Anonymous";

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
                name: commentName,
                image: fileType === 'image' ? { connect: { id: fileId } } : undefined,
                video: fileType === 'video' ? { connect: { id: fileId } } : undefined
            }
        } else {
            data = {
                text: parsedData.data.content,
                name: commentName,
                image: fileType === 'image' ? { connect: { id: fileId } } : undefined,
                video: fileType === 'video' ? { connect: { id: fileId } } : undefined
            }
        }

        const comment = await prisma.comment.create({
            data,
            include: { image: { include: { folder: true } } }
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