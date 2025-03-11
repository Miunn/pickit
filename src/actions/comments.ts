'use server'

import { CreateCommentFormSchema, FolderWithAccessToken, FolderWithCreatedBy, FolderWithImagesWithFolderAndComments, FolderWithPersonAccessToken } from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

export async function createComment(
    imageId: string,
    data: z.infer<typeof CreateCommentFormSchema>,
    shareToken?: string | null,
    type?: "accessToken" | "personAccessToken" | null,
    h?: string | null
): Promise<boolean> {
    const { user } = await getCurrentSession();

    if (!user && (!shareToken || !type)) {
        return false;
    }

    const image = await prisma.image.findUnique({
        where: { id: imageId },
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

    if (!image) {
        return false;
    }

    const folder: FolderWithImagesWithFolderAndComments & FolderWithCreatedBy & FolderWithAccessToken & FolderWithPersonAccessToken = image.folder;
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
                createdBy: {
                    connect: {
                        id: user?.id
                    }
                },
                name: commentName,
                image: { connect: { id: imageId } }
            }
        } else {
            data = {
                text: parsedData.data.content,
                name: commentName,
                image: { connect: { id: imageId } }
            }
        }

        const comment = await prisma.comment.create({
            data,
            include: { image: { include: { folder: true } } }
        });
        revalidatePath(`/app/folders/${comment.image.folder.id}`);
        return true;
    } catch (e) {
        return false;
    }
}