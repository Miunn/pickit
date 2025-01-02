"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "@/actions/auth";
import * as fs from "fs";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { ImageLightWithFolderName, ImageWithFolder } from "@/lib/definitions";
import { imageCreateManyAndUpdateSizes, imageDeleteAndUpdateSizes } from "@/lib/prismaExtend";
import { changeFolderCover } from "./folders";

export async function getLightImages(): Promise<{
    error: string | null;
    lightImages: ImageLightWithFolderName[];
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to get images", lightImages: [] }
    }

    const images = await prisma.image.findMany({
        where: {
            createdBy: {
                id: session.user.id
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

export async function uploadImages(parentFolderId: string, formData: FormData): Promise<{ error: string | null }> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to upload images" };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: parentFolderId,
            createdBy: { id: session.user.id }
        }
    });

    if (!folder) {
        return { error: "You are not authorized to upload images to this folder" };
    }

    const folderPath = `drive/${parentFolderId}`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const files = Array.from(formData.values()) as File[];
    const imagesDb = await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        const slug = `${file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

        const image = sharp(buffer);
        const metadata = await image.metadata();

        const imageData = {
            name: nameWithoutExtension,
            slug,
            extension: metadata.format || "png",
            size: file.size,
            width: metadata.width || 0,
            height: metadata.height || 0
        };

        try {
            await fs.promises.writeFile(`${folderPath}/${slug}.${imageData.extension}`, buffer);
        } catch (err) {
            console.error("Error writing file:", err);
            throw new Error("File upload failed");
        }

        return imageData;
    }));

    await imageCreateManyAndUpdateSizes(imagesDb, parentFolderId, session.user.id!);

    if (folder.coverId === null) {
        const cover = await prisma.image.findFirst({
            where: {
                folderId: parentFolderId
            },
            select: { id: true }
        });
        await changeFolderCover(parentFolderId, cover!.id);
    }

    revalidatePath(`dashboard/folders/${parentFolderId}`);
    revalidatePath("dashboard");

    return { error: null };
}

export async function getImagesWithFolderFromFolder(folderId: string): Promise<{
    images: ImageWithFolder[],
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to load images from folder", images: [] }
    }

    const images = await prisma.image.findMany({
        where: {
            folder: {
                id: folderId
            },
            createdBy: {
                id: session.user.id
            }
        },
        include: {
            folder: true
        }
    });

    return { error: null, images: images };
}

export async function deleteImage(imageId: string) {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to delete images" };
    }

    // Check if user is authorized to delete this image
    // (User was the creator of the folder containing the image)

    const image = await prisma.image.findUnique({
        where: {
            id: imageId,
            createdBy: {
                id: session.user.id
            }
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

    if (!image) {
        return { error: "Image not found" };
    }

    if (image.folder.createdBy.id !== session.user.id) {
        return { error: "You are not authorized to delete this image" };
    }

    fs.unlink(process.cwd() + "/" + image.path, (err) => {
        if (err) {
            console.error("Error deleting file", err);
        }
    });

    await imageDeleteAndUpdateSizes(imageId, session.user.id);
    
    revalidatePath("dashboard/folders/" + image.folder.id);
    revalidatePath("dashboard");
    return { error: null };
}

export async function deleteImages(imageIds: string[]) {
    for (const imageId of imageIds) {
        await deleteImage(imageId);
    }
    return { error: null };
}
