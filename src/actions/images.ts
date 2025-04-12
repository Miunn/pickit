"use server"

import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { ImageLightWithFolderName, ImageWithComments, ImageWithFolder, RenameImageFormSchema } from "@/lib/definitions";
import { imageCreateManyAndUpdateSizes, imageDeleteAndUpdateSizes, videoCreateManyAndUpdatSizes, videoDeleteAndUpdateSizes } from "@/lib/prismaExtend";
import { changeFolderCover } from "./folders";
import { validateShareToken } from "@/lib/utils";
import { getCurrentSession } from "@/lib/session";
import { fileTypeFromBuffer } from 'file-type';
import { z } from "zod";
import { generateV4UploadUrl, GoogleBucket } from "@/lib/bucket";
import { randomUUID } from "crypto";
import mediaInfoFactory, { Track } from "mediainfo.js";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

ffmpeg.setFfmpegPath("node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe");

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

export async function uploadImages(
    parentFolderId: string,
    formData: FormData,
    shareToken?: string | null,
    tokenType?: "accessToken" | "personAccessToken" | null,
    hashCode?: string | null
): Promise<{
    uploadUrls: { [key: string]: string } | null,
    error: string | null,
    used?: bigint,
    max?: bigint,
    rejectedFiles?: string[]
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        if (!shareToken || !tokenType) {
            return { error: "You must be logged in to upload images", uploadUrls: null };
        }

        const validateToken = await validateShareToken(parentFolderId, shareToken, tokenType, hashCode);

        if (validateToken.error) {
            return { error: "You must have a valid share link to upload to this folder", uploadUrls: null };
        }

        if (validateToken.folder === null) {
            return { error: "Folder not found", uploadUrls: null };
        }

        if (validateToken.permission === "READ") {
            return { error: "You do not have permission to upload images to this folder", uploadUrls: null };
        }
    }

    const folder = await prisma.folder.findUnique({
        where: { id: parentFolderId },
        include: { createdBy: true }
    });

    if (!folder) {
        return { error: "You are not authorized to upload images to this folder", uploadUrls: null };
    }

    const file = formData.get("image") as File;
    const fileName = formData.get("name") as string;
    if (!file || !fileName) {
        return { error: "No file found", uploadUrls: null };
    }

    if (file.size > folder.createdBy.maxStorage - folder.createdBy.usedStorage) {
        return { error: "not-enough-storage", used: folder.createdBy.usedStorage, max: folder.createdBy.maxStorage, uploadUrls: null };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const typeFromBuffer = await fileTypeFromBuffer(buffer);
    console.log("Type from buffer:", typeFromBuffer);
    if (!typeFromBuffer || (!typeFromBuffer.mime.startsWith("image") && !typeFromBuffer.mime.startsWith("video"))) {
        console.log("Reject file");
        return { error: 'invalid-file', rejectedFiles: [fileName], uploadUrls: null };
    }

    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    const slug = `${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    let data;
    if (typeFromBuffer.mime.startsWith("video")) {
        const mediainfo = await mediaInfoFactory({ locateFile: (file) => `${process.env.APP_URL}/mediainfo/${file}` });
        const metadata = await mediainfo.analyzeData(buffer.length, () => buffer)
        mediainfo.close();

        // Extract thumbnail from video
        const thumbnailBuffer = await new Promise<Buffer>((resolve, reject) => {
            const inputStream = new PassThrough();
            const passThrough = new PassThrough();
            const chunks: Buffer[] = [];

            passThrough.on("data", (chunk) => chunks.push(chunk));
            passThrough.on("end", () => resolve(Buffer.concat(chunks)));
            passThrough.on("error", reject);

            inputStream.end(buffer);
            ffmpeg()
                .input(inputStream)
                .outputOptions("-frames:v 1") // Extract a single frame
                .format("image2") // Output format as image
                .pipe(passThrough, { end: true });
        });

        const videoId = randomUUID().toString();
        const videoData = {
            id: videoId,
            name: nameWithoutExtension,
            size: file.size,
            extension: typeFromBuffer.ext,
            width: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Width || 0,
            height: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Height || 0,
            duration: metadata.media?.track.find((track: Track) => track["@type"] === "General")?.Duration || 0,
            thumbnail: videoId + '-thumbnail',
        }
        await videoCreateManyAndUpdatSizes([videoData], parentFolderId, user?.id ? user.id : folder.createdById);

        try {
            await GoogleBucket.file(`${user!.id}/${parentFolderId}/${videoData.thumbnail}`).save(thumbnailBuffer);
        } catch (err) {
            console.error("Error writing file:", err);
            throw new Error("File upload failed");
        }

        data = videoData;
    } else if (typeFromBuffer.mime.startsWith("image")) {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        const imageData = {
            id: randomUUID().toString(),
            name: nameWithoutExtension,
            slug,
            extension: typeFromBuffer.ext,
            size: file.size,
            width: metadata.width || 0,
            height: metadata.height || 0
        };

        await imageCreateManyAndUpdateSizes([imageData], parentFolderId, user?.id ? user.id : folder.createdById);

        if (folder.coverId === null) {
            const cover = await prisma.image.findFirst({
                where: {
                    folderId: parentFolderId
                },
                select: { id: true }
            });
            await changeFolderCover(parentFolderId, cover!.id);
        }

        data = imageData;
    }

    if (!data) {
        return { error: "error-creating-image", uploadUrls: null };
    }

    const uploadUrls: { [key: string]: string } = {};
    try {
        uploadUrls[formData.get("uploadUrlId") as string] = await generateV4UploadUrl(`${user!.id}/${parentFolderId}/${data?.id}`);
        // await GoogleBucket.file(`${user!.id}/${parentFolderId}/${data?.id}`).save(buffer, { resumable: true });
    } catch (err) {
        console.error("Error writing file:", err);
        throw new Error("File upload failed");
    }

    revalidatePath(`/app/folders/${parentFolderId}`);
    revalidatePath("/app/folders");
    revalidatePath("/app");

    return { error: null, uploadUrls: uploadUrls };
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
            comments: { include: { createdBy: true } }
        }
    });

    return { error: null, images: images };
}

export async function renameImage(fileId: string, fileType: string, data: z.infer<typeof RenameImageFormSchema>): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to rename images" };
    }

    const parsedData = RenameImageFormSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: "invalid-data" };
    }

    if (fileType === "image") {
        try {
            const image = await prisma.image.update({
                where: { id: fileId, createdBy: { id: user.id } },
                data: { name: parsedData.data.name }
            });
            revalidatePath(`/app/folders/${image.folderId}`);
        } catch (err) {
            console.error("Error renaming image:", err);
            return { error: "Image not found" };
        }
    } else if (fileType === "video") {
        try {
            const video = await prisma.video.update({
                where: { id: fileId, createdBy: { id: user.id } },
                data: { name: parsedData.data.name }
            });
            revalidatePath(`/app/folders/${video.folderId}`);
        } catch (err) {
            console.error("Error renaming video:", err);
            return { error: "Video not found" };
        }
    }

    revalidatePath("/app");
    return { error: null };
}

export async function deleteImage(folderId: string, fileId: string, fileType: string, shareToken?: string, hashPin?: string, tokenType?: string) {
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

    let file = null;

    if (user) {
        if (fileType === "video") {
            file = await prisma.video.findUnique({
                where: {
                    id: fileId,
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

            try {
                await GoogleBucket.file(`${file?.createdById}/${file?.folderId}/${file?.thumbnail}`).delete();
            } catch (err) {
                console.error("Error deleting thumbnail:", err);
            }
        } else if (fileType === "image") {
            file = await prisma.image.findUnique({
                where: {
                    id: fileId,
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
        }
    } else if (validateToken) {
        if (fileType === "video") {
            file = await prisma.video.findUnique({
                where: {
                    id: fileId,
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
            try {
                await GoogleBucket.file(`${file?.createdById}/${file?.folderId}/${file?.thumbnail}`).delete();
            } catch (err) {
                console.error("Error deleting thumbnail:", err);
            }
        } else if (fileType === "image") {
            file = await prisma.image.findUnique({
                where: {
                    id: fileId,
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
    }

    if (!file) {
        return { error: "File not found" };
    }

    try {
        const r = await GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.id}`).delete();
    } catch (err) {
        console.error("Error deleting file:", err);
    }

    if (user) {
        if (file.type === "video") {
            await videoDeleteAndUpdateSizes(fileId, user.id);
        } else {
            await imageDeleteAndUpdateSizes(fileId, user.id);
        }
    } else if (validateToken?.folder) {
        await imageDeleteAndUpdateSizes(fileId, validateToken.folder.createdById);
    }

    revalidatePath(`/app/folders/${file.folder.id}`);
    revalidatePath(`/app/folders`);
    return { error: null };
}

export async function deleteImages(files: { id: string, type: string }[]) {
    for (const file of files) {
        await deleteImage("", file.id, file.type);
    }
    return { error: null };
}
