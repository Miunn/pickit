"use server"

import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { ImageLightWithFolderName, ImageWithComments, ImageWithFolder, RenameImageFormSchema } from "@/lib/definitions";
import { imageCreateManyAndUpdateSizes, imageDeleteAndUpdateSizes } from "@/lib/prismaExtend";
import { changeFolderCover } from "./folders";
import { validateShareToken } from "@/lib/utils";
import { getCurrentSession } from "@/lib/session";
import JSZip from "jszip";
import { fileTypeFromBuffer } from 'file-type';
import { z } from "zod";
import { GoogleBucket } from "@/lib/bucket";
import { randomUUID } from "crypto";

export async function getLightImages(): Promise<{
    error: string | null;
    lightImages: ImageLightWithFolderName[];
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to get images", lightImages: [] }
    }

    const images = await prisma.image.findMany({
        where: {
            createdBy: {
                id: user.id
            }
        },
        select: {
            id: true,
            name: true,
            folder: {
                select: {
                    id: true,
                    name: true
                }
            },
        },
        orderBy: [
            {
                folder: {
                    name: "asc"
                },
            },
            {
                name: "asc"
            }
        ],
    });

    return { error: null, lightImages: images }
}

export async function uploadImages(parentFolderId: string, formData: FormData, shareToken?: string | null, tokenType?: "accessToken" | "personAccessToken" | null, hashCode?: string | null): Promise<{ error: string | null, rejectedFiles?: string[] }> {
    const { user } = await getCurrentSession();

    if (!user) {
        if (!shareToken || !tokenType) {
            return { error: "You must be logged in to upload images" };
        }

        const validateToken = await validateShareToken(parentFolderId, shareToken, tokenType, hashCode);

        if (validateToken.error) {
            return { error: "You must have a valid share link to upload to this folder" };
        }

        if (validateToken.folder === null) {
            return { error: "Folder not found" };
        }

        if (validateToken.permission === "READ") {
            return { error: "You do not have permission to upload images to this folder" };
        }
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: parentFolderId,
        }
    });

    if (!folder) {
        return { error: "You are not authorized to upload images to this folder" };
    }

    const files = Array.from(formData.values()) as File[];
    const rejectedFiles: string[] = [];
    const imagesDb = await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const typeFromBuffer = await fileTypeFromBuffer(buffer);
        console.log("Type from buffer", typeFromBuffer);
        if (!typeFromBuffer || !typeFromBuffer.mime.startsWith("image")) {
            console.log("Rejected file", file.name);
            rejectedFiles.push(file.name);
            return undefined;
        }

        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        const slug = `${file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

        const image = sharp(buffer);
        const metadata = await image.metadata();

        const imageData = {
            id: randomUUID().toString(),
            name: nameWithoutExtension,
            slug,
            extension: metadata.format || "png",
            size: file.size,
            width: metadata.width || 0,
            height: metadata.height || 0
        };

        try {
            await GoogleBucket.file(`${user!.id}/${parentFolderId}/${imageData.id}`).save(buffer);
        } catch (err) {
            console.error("Error writing file:", err);
            throw new Error("File upload failed");
        }

        return imageData;
    }));

    await imageCreateManyAndUpdateSizes(imagesDb.filter((i) => i !== undefined), parentFolderId, user?.id ? user.id : folder.createdById);

    if (folder.coverId === null) {
        const cover = await prisma.image.findFirst({
            where: {
                folderId: parentFolderId
            },
            select: { id: true }
        });
        await changeFolderCover(parentFolderId, cover!.id);
    }

    revalidatePath("/app/folders/${parentFolderId}");
    revalidatePath("/app/folders");
    revalidatePath("/app");

    console.log("End of upload, rejected are", rejectedFiles);
    return { error: null, rejectedFiles: rejectedFiles.length > 0 ? rejectedFiles : undefined };
}

export async function getImagesWithFolderAndCommentsFromFolder(folderId: string): Promise<{
    images: (ImageWithFolder & ImageWithComments)[],
    error: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to load images from folder", images: [] }
    }

    const images = await prisma.image.findMany({
        where: {
            folder: {
                id: folderId
            },
            createdBy: {
                id: user.id
            }
        },
        include: {
            folder: true,
            comments: { include: { createdBy: true }}
        }
    });

    return { error: null, images: images };
}

export async function renameImage(imageId: string, data: z.infer<typeof RenameImageFormSchema>): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to rename images" };
    }

    const parsedData = RenameImageFormSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: "invalid-data" };
    }

    const image = await prisma.image.findUnique({
        where: {
            id: imageId,
            createdBy: {
                id: user.id
            }
        },
        include: { folder: true }
    });

    if (!image) {
        return { error: "Image not found" };
    }

    await prisma.image.update({
        where: { id: imageId },
        data: { name: parsedData.data.name }
    });

    revalidatePath(`/app/folders/${image.folder.id}`);
    revalidatePath("/app");
    return { error: null };
}

export async function deleteImage(folderId: string, imageId: string, shareToken?: string, hashPin?: string, tokenType?: string) {
    let validateToken = null;
    if (shareToken) {
        validateToken = await validateShareToken(folderId, shareToken, tokenType === "p" ? "personAccessToken" : "accessToken", hashPin);

        if (validateToken.error) {
            return { error: "You must have a valid share link to delete this image" };
        }

        if (validateToken.folder === null) {
            return { error: "Folder not found" };
        }

        if (validateToken.permission === "READ") {
            return { error: "You do not have permission to delete this image" };
        }
    }
    
    const { user } = await getCurrentSession();

    if (!user && !validateToken) {
        return { error: "You must be logged in to delete images" };
    }

    // Check if user is authorized to delete this image
    // (User was the creator of the folder containing the image)

    let image = null;

    if (user) {
        image = await prisma.image.findUnique({
            where: {
                id: imageId,
                createdBy: { id: user.id }
            },
            include: {
                folder: {
                    select: {
                        id: true,
                        createdBy: true
                    }
                }
            }
        });
    } else if (validateToken) {
        image = await prisma.image.findUnique({
            where: {
                id: imageId,
                createdBy: { id: validateToken.folder?.createdById }
            },
            include: {
                folder: {
                    select: {
                        id: true,
                        createdBy: true
                    }
                }
            }
        });
    }

    if (!image) {
        return { error: "Image not found" };
    }

    try {
        const r = await GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`).delete();        
    } catch (err) {
        console.error("Error deleting file:", err);
    }

    if (user) {
        await imageDeleteAndUpdateSizes(imageId, user.id);
    } else if (validateToken?.folder) {
        await imageDeleteAndUpdateSizes(imageId, validateToken.folder.createdById);
    }

    revalidatePath(`/app/folders/${image.folder.id}`);
    revalidatePath(`/app/folders`);
    return { error: null };
}

export async function deleteImages(imageIds: string[]) {
    for (const imageId of imageIds) {
        await deleteImage("", imageId);
    }
    return { error: null };
}
