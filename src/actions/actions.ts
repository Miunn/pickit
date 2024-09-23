"use server";

import {Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {auth} from "@/actions/auth";
import * as fs from "fs";
import {revalidatePath} from "next/cache";

export async function createFolder(name: string): Promise<{
    folder: Prisma.Prisma__FolderClient<any> | null,
    error: string | null,
}> {
    const session = await auth();

    if (!session?.user) {
        return {folder: null, error: "You must be logged in to create a folders"};
    }

    console.log("Creating folders", name);

    const folder = await prisma.folder.create({
        data: {
            name: name,
            createdBy: {
                connect: {
                    id: session.user.id as string
                }
            }
        }
    });

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return {folder: folder, error: null};
}

export async function renameFolder(folderId: string, name: string): Promise<{
    folder: Prisma.Prisma__FolderClient<any> | null,
    error: string | null,
}> {
    const session = await auth();

    if (!session?.user) {
        return {folder: null, error: "You must be logged in to rename a folders"};
    }

    console.log("Renaming folders", name);

    const folder = await prisma.folder.update({
        where: {
            id: folderId,
            createdBy: {
                id: session.user.id as string
            }
        },
        data: {
            name: name,
            updatedAt: ""
        }
    });

    revalidatePath("dashboard/folders");
    revalidatePath("dashboard");
    return {folder: folder, error: null};
}

export async function deleteFolder(folderId: string): Promise<any> {
    const session = await auth();

    if (!session?.user) {
        return {error: "You must be logged in to delete a folders"};
    }

    console.log("Deleting folders", folderId);

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
