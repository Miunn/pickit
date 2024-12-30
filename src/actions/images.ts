"use server"

import { prisma } from "@/lib/prisma";
import { auth } from "@/actions/auth";
import * as fs from "fs";
import { revalidatePath } from "next/cache";
import { ImageLightWithFolderName, ImageWithFolder } from "@/lib/definitions";
import { imageCreateManyAndUpdateSizes, imageDeleteAndUpdateSizes } from "@/lib/prismaExtend";

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

export async function uploadImages(parentFolderId: string, formData: FormData): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to upload images" };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: parentFolderId,
            createdBy: {
                id: session.user.id
            }
        }
    });

    if (!folder) {
        return { error: "You are not authorized to upload images to this folder" };
    }

    // Create folders if it doesn't exist
    if (!fs.existsSync(`drive/${parentFolderId}`)) {
        fs.mkdirSync(`drive/${parentFolderId}`);
    }

    let imagesDb: { name: string, slug: string, extension: string, size: number }[] = [];
    for (const file of formData.values() as IterableIterator<File>) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
        const extension = file.name.split('.').pop();
        const slug = file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + "-" + Date.now();

        fs.writeFile(`drive/${parentFolderId}/${slug}.${extension}`, buffer, async (err) => {
            if (err) {
                console.error("Error uploading file", err);
                return;
            }
        });

        imagesDb.push({
            name: nameWithoutExtension,
            slug: slug,
            extension: extension || "png",
            size: file.size
        });
    }

    await imageCreateManyAndUpdateSizes(imagesDb, parentFolderId, session.user.id!);

    revalidatePath("dashboard/folders/" + parentFolderId);
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
