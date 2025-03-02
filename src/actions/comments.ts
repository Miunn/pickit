'use server'

import { CreateCommentFormSchema } from "@/lib/definitions";
import { getCurrentSession } from "@/lib/authUtils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createComment(imageId: string, data: z.infer<typeof CreateCommentFormSchema>): Promise<boolean> {
    const { user } = await getCurrentSession();
    
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
                image: { connect: { id: imageId } }
            }
        } else {
            data = {
                text: parsedData.data.content,
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