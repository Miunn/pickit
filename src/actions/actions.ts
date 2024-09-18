"use server";

import {Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {auth} from "@/actions/auth";
import * as fs from "fs";
import {revalidatePath} from "next/cache";
import JSZip from "jszip";


export async function createFolder(name: string): Promise<{ folder: Prisma.Prisma__FolderClient<any> | null, error: string | null, }> {
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

export async function renameFolder(folderId: string, name: string): Promise<{ folder: Prisma.Prisma__FolderClient<any> | null, error: string | null, }> {
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
            updatedAt: Date.now().toString()
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

export async function uploadImages(parentFolderId: string, amount: number, formData: FormData): Promise<{ error: string | null }> {
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

    revalidatePath("dashboard/folders/" + parentFolderId);
    revalidatePath("dashboard");
    return {error: null};
}
