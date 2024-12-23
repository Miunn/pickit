"use server";

import {prisma} from "@/lib/prisma";
import {auth} from "@/actions/auth";
import * as fs from "fs";
import {revalidatePath} from "next/cache";
import { ImageWithFolder } from "@/lib/definitions";

export async function getLightFolders(): Promise<{
    lightFolders: { id: string; name: string; }[],
    error?: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { lightFolders: [], error: "You must be logged in to create a folders" };
    }

    const folders = await prisma.folder.findMany({
        select: {
            id: true,
            name: true
        }
    });

    return { lightFolders: folders, error: null }
}

export async function getFolderName(id: string): Promise<{
    folder?: { id: string; name: string; } | null,
    error?: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return { folder: null, error: "You must be logged in to get folder name" };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            name: true
        }
    });

    return { folder: folder, error: null }
}

export async function createFolder(name: string): Promise<{
    folder: { id: string; name: string; coverId: string | null; createdById: string; createdAt: Date; updatedAt: Date; } | null,
    error: string | null,
}> {
    const session = await auth();

    if (!session?.user) {
        return {folder: null, error: "You must be logged in to create a folders"};
    }

    const readToken = crypto.randomUUID();
    const writeToken = crypto.randomUUID();
    const folder = await prisma.folder.create({
        data: {
            name: name,
            createdBy: {
                connect: {
                    id: session.user.id as string
                }
            },
            AccessToken: {
                create: [
                    {
                        token: readToken,
                        permission: "READ",
                        expires: new Date(new Date().setMonth((new Date()).getMonth() + 8)),
                    },
                    {
                        token: writeToken,
                        permission: "WRITE",
                        expires: new Date(new Date().setMonth((new Date()).getMonth() + 8)),
                    }
                ]
            }
        }
    });

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return {folder: folder, error: null};
}

export async function renameFolder(folderId: string, name: string): Promise<{
    folder: { id: string; name: string; coverId: string | null; createdById: string; createdAt: Date; updatedAt: Date; } | null,
    error: string | null,
}> {
    const session = await auth();

    if (!session?.user) {
        return {folder: null, error: "You must be logged in to rename a folders"};
    }

    const folder = await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id as string
            }
        },
        data: {
            name: name,
        }
    });

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return {folder: folder, error: null};
}

export async function changeFolderCover(folderId: string, coverId: string): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return {error: "You must be logged in to change a folder's cover"};
    }

    await prisma.folder.update({
        where: {
            id: folderId
        },
        data: {
            cover: {
                connect: {
                    id: coverId
                }
            }
        }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/folders");
    return { error: null }
}

export async function deleteFolder(folderId: string): Promise<any> {
    const session = await auth();

    if (!session?.user) {
        return {error: "You must be logged in to delete a folders"};
    }

    const images = await prisma.image.findMany({
        where: {
            folderId: folderId,
            createdBy: {
                id: session.user.id as string
            }
        }
    });

    for (const image of images) {
        await fs.unlink(process.cwd() + "/" + image.path, (err) => {
            if (err) {
                console.error("Error deleting file", err);
            }
        });
    }

    await prisma.folder.delete({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id as string
            }
        }
    });

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return {error: null};
}

export async function uploadImages(parentFolderId: string, amount: number, formData: FormData): Promise<{
    error: string | null
}> {
    const session = await auth();

    if (!session?.user) {
        return {error: "You must be logged in to upload images"};
    }

    // Create folders if it doesn't exist
    if (!fs.existsSync(`drive/${parentFolderId}`)) {
        fs.mkdirSync(`drive/${parentFolderId}`);
    }

    for (const file of formData.values() as IterableIterator<File>) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
        const extension = file.name.split('.').pop();
        const slug = file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + "-" + Date.now();

        await fs.writeFile(`drive/${parentFolderId}/${slug}.${extension}`, buffer, async (err) => {
            if (err) {
                console.error("Error uploading file", err);
                return;
            }

            await prisma.image.create({
                data: {
                    name: nameWithoutExtension,
                    path: `drive/${parentFolderId}/${slug}.${extension}`,
                    createdBy: {
                        connect: {
                            id: session.user!.id as string
                        }
                    },
                    folder: {
                        connect: {
                            id: parentFolderId
                        }
                    }
                }
            });
        });
    }

    // Update folder updatedAt
    await prisma.folder.update({
        where: {
            id: parentFolderId
        },
        data: {
            updatedAt: new Date().toISOString()
        }
    });

    revalidatePath("dashboard/folders/" + parentFolderId);
    revalidatePath("dashboard");
    return {error: null};
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
        return {error: "You must be logged in to delete images"};
    }

    // Check if user is authorized to delete this image
    // (User was the creator of the folder containing the image)

    const image = await prisma.image.findUnique({
        where: {
            id: imageId
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
        return {error: "Image not found"};
    }

    if (image.folder.createdBy.id !== session.user.id) {
        return {error: "You are not authorized to delete this image"};
    }

    await fs.unlink(process.cwd() + "/" + image.path, (err) => {
        if (err) {
            console.error("Error deleting file", err);
        }
    });

    await prisma.image.delete({
        where: {
            id: imageId
        }
    });

    revalidatePath("dashboard/folders/" + image.folder.id);
    revalidatePath("dashboard");
    return {error: null};
}

export async function deleteImages(imageIds: string[]) {
    for (const imageId of imageIds) {
        await deleteImage(imageId);
    }
    return {error: null};
}
