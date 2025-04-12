"use server"

import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { ImageLightWithFolderName, ImageWithComments, ImageWithFolder, RenameImageFormSchema } from "@/lib/definitions";
import { imageDeleteAndUpdateSizes, videoCreateManyAndUpdatSizes, videoDeleteAndUpdateSizes } from "@/lib/prismaExtend";
import { validateShareToken } from "@/lib/utils";
import { getCurrentSession } from "@/lib/session";
import { fileTypeFromBuffer } from 'file-type';
import { z } from "zod";
import { GoogleBucket } from "@/lib/bucket";
import mediaInfoFactory, { Track } from "mediainfo.js";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import crypto from "crypto";

ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH as string);

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

export async function initiateImageUpload(
    formData: FormData,
    parentFolderId: string
): Promise<{
    error: string | null;
    uploadUrl: string | null;
    verificationToken?: string;
    fileId?: string;
}> {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
        return { error: "not-authenticated", uploadUrl: null };
    }

    const fileName = formData.get("fileName") as string;
    const fileSize = Number(formData.get("fileSize"));
    const fileType = formData.get("fileType") as string;
    const fileSamples = formData.get("fileSamples") as string; // Base64 encoded samples

    if (!fileName || !fileSize || !fileType || !fileSamples) {
        return { error: "missing-metadata", uploadUrl: null };
    }

    // Validate file type
    if (!isValidFileType(fileType)) {
        return { error: "invalid-file-type", uploadUrl: null };
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const fileId = crypto.randomBytes(16).toString('hex');

    // Save verification data to cloud storage
    const verificationData = {
        name: fileName,
        size: fileSize,
        type: fileType,
        samples: JSON.parse(fileSamples), // Parse the samples array
        userId: session.user.id,
        timestamp: Date.now()
    };

    try {
        await GoogleBucket.file(`${session.user.id}/${parentFolderId}/verification/${verificationToken}.json`)
            .save(JSON.stringify(verificationData), {
                metadata: {
                    contentType: 'application/json',
                    metadata: {
                        userId: session.user.id,
                        folderId: parentFolderId,
                        fileId: fileId
                    }
                }
            });

        // Generate signed URL for upload
        const [uploadUrl] = await GoogleBucket.file(`${session.user.id}/${parentFolderId}/${fileId}`)
            .getSignedUrl({
                version: 'v4',
                action: 'write',
                expires: Date.now() + 15 * 60 * 1000, // 15 minutes
                contentType: fileType
            });

        return {
            error: null,
            uploadUrl,
            verificationToken,
            fileId
        };
    } catch (err) {
        console.error("Error initiating upload:", err);
        return { error: "upload-initiation-failed", uploadUrl: null };
    }
}

export async function finalizeImageUpload(
    formData: FormData,
    parentFolderId: string
): Promise<{ error: string | null; fileId: string | null }> {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
        return { error: "not-authenticated", fileId: null };
    }

    const verificationToken = formData.get("verificationToken") as string;
    const fileId = formData.get("fileId") as string;

    if (!verificationToken || !fileId) {
        return { error: "missing-verification-data", fileId: null };
    }

    try {
        // Get verification data
        const [verificationFile] = await GoogleBucket.file(`${session.user.id}/${parentFolderId}/verification/${verificationToken}.json`).download();
        const verificationData = JSON.parse(verificationFile.toString());

        // Verify metadata
        if (verificationData.userId !== session.user.id) {
            return { error: "verification-failed", fileId: null };
        }

        // Get the uploaded file
        const [uploadedFile] = await GoogleBucket.file(`${session.user.id}/${parentFolderId}/${fileId}`).download();
        const uploadedBuffer = Buffer.from(uploadedFile);

        // Verify file type
        const detectedType = await fileTypeFromBuffer(uploadedBuffer);
        if (!detectedType || detectedType.mime !== verificationData.type) {
            await GoogleBucket.file(`${session.user.id}/${parentFolderId}/${fileId}`).delete();
            return { error: "file-type-mismatch", fileId: null };
        }

        // Verify file size
        if (uploadedBuffer.length !== verificationData.size) {
            await GoogleBucket.file(`${session.user.id}/${parentFolderId}/${fileId}`).delete();
            return { error: "file-size-mismatch", fileId: null };
        }

        // Verify file samples
        const sampleSize = 1024 * 1024; // 1MB
        const samples = verificationData.samples;
        for (let i = 0; i < samples.length; i++) {
            const start = i * sampleSize;
            const end = Math.min(start + sampleSize, uploadedBuffer.length);
            const sample = uploadedBuffer.slice(start, end);
            const sampleHash = crypto.createHash('sha256').update(sample).digest('base64');

            if (sampleHash !== samples[i]) {
                await GoogleBucket.file(`${session.user.id}/${parentFolderId}/${fileId}`).delete();
                return { error: "file-content-mismatch", fileId: null };
            }
        }

        // Delete verification file
        await GoogleBucket.file(`${session.user.id}/${parentFolderId}/verification/${verificationToken}.json`).delete();

        // Create database record
        if (verificationData.type.startsWith("image/")) {
            const metadata = await sharp(uploadedBuffer).metadata();
            const image = await prisma.image.create({
                data: {
                    id: fileId,
                    name: verificationData.name.split('.')[0],
                    size: verificationData.size,
                    folderId: parentFolderId,
                    createdById: session.user.id,
                    extension: verificationData.name.split('.').pop() || '',
                    width: metadata.width || 0,
                    height: metadata.height || 0
                }
            });
            revalidatePath(`/app/folders/${parentFolderId}`);
            revalidatePath(`/app/folders`);
            revalidatePath(`/app`);

            return { error: null, fileId: image.id };
        } else if (verificationData.type.startsWith("video/")) {
            // Process thumbnail creation
            const thumbnailBuffer = await new Promise<Buffer>((resolve, reject) => {
                const inputStream = new PassThrough();
                const passThrough = new PassThrough();
                const chunks: Buffer[] = [];

                passThrough.on("data", (chunk) => chunks.push(chunk));
                passThrough.on("end", () => resolve(Buffer.concat(chunks)));
                passThrough.on("error", reject);

                inputStream.end(uploadedBuffer);
                ffmpeg()
                    .input(inputStream)
                    .outputOptions("-frames:v 1")
                    .format("image2")
                    .pipe(passThrough, { end: true });
            });

            // Save thumbnail
            await GoogleBucket.file(`${session.user.id}/${parentFolderId}/${fileId}-thumbnail`).save(thumbnailBuffer);

            // Create video record
            const mediainfo = await mediaInfoFactory({ locateFile: (file) => `${process.env.APP_URL}/mediainfo/${file}` });
            const metadata = await mediainfo.analyzeData(uploadedBuffer.length, () => uploadedBuffer);
            mediainfo.close();
            const video = await prisma.video.create({
                data: {
                    id: fileId,
                    name: verificationData.name.split('.')[0],
                    size: verificationData.size,
                    folderId: parentFolderId,
                    createdById: session.user.id,
                    extension: verificationData.name.split('.').pop() || '',
                    thumbnail: `${fileId}-thumbnail`,
                    width: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Width || 0,
                    height: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Height || 0,
                    duration: metadata.media?.track.find((track: Track) => track["@type"] === "General")?.Duration || 0
                }
            });

            revalidatePath(`/app/folders/${parentFolderId}`);
            revalidatePath(`/app/folders`);
            revalidatePath(`/app`);

            return { error: null, fileId: video.id };
        }

        return { error: "invalid-file-type", fileId: null };
    } catch (err) {
        console.error("Error finalizing upload:", err);
        return { error: "upload-finalization-failed", fileId: null };
    }
}

// Helper function to validate file type
function isValidFileType(fileType: string): boolean {
    return fileType.startsWith("image/") || fileType.startsWith("video/");
}

// Update the uploadImages function to match the new return types
export async function uploadImages(
    formData: FormData,
    parentFolderId: string,
    isVerificationStep: boolean = false
): Promise<{
    error: string | null;
    uploadUrl?: string | null;
    imageId?: string | null;
}> {
    if (isVerificationStep) {
        return await finalizeImageUpload(formData, parentFolderId);
    } else {
        return await initiateImageUpload(formData, parentFolderId);
    }
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


            console.log("File", file);

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

export async function processVideoAfterUpload(
    folderId: string,
    videoId: string
): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to process video after upload" };
    }

    try {
        const video = await prisma.video.findUnique({
            where: {
                id: videoId,
                folderId: folderId,
                createdById: user.id
            }
        });

        if (!video) {
            return { error: "Video not found" };
        }

        // Download video from cloud storage
        const file = GoogleBucket.file(`${user.id}/${folderId}/${videoId}`);
        const [buffer] = await file.download();

        // Process video metadata
        const mediainfo = await mediaInfoFactory({ locateFile: (file) => `${process.env.APP_URL}/mediainfo/${file}` });
        const metadata = await mediainfo.analyzeData(buffer.length, () => buffer);
        mediainfo.close();

        // Extract thumbnail
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
                .outputOptions("-frames:v 1")
                .format("image2")
                .pipe(passThrough, { end: true });
        });

        // Save thumbnail
        await GoogleBucket.file(`${user.id}/${folderId}/${video.thumbnail}`).save(thumbnailBuffer);

        // Update video record with metadata
        await prisma.video.update({
            where: { id: videoId },
            data: {
                width: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Width || 0,
                height: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Height || 0,
                duration: metadata.media?.track.find((track: Track) => track["@type"] === "General")?.Duration || 0,
            }
        });

        return { error: null };
    } catch (err) {
        console.error("Error processing video:", err);
        return { error: "Failed to process video" };
    }
}

// Add this function to clean up orphaned verification files
export async function cleanupOrphanedVerificationFiles(
    parentFolderId: string,
    maxAgeHours: number = 24
): Promise<{ error: string | null, cleanedCount: number }> {
    try {
        const { user } = await getCurrentSession();

        if (!user) {
            return { error: "You must be logged in to clean up verification files", cleanedCount: 0 };
        }

        // List all verification files in the folder
        const [files] = await GoogleBucket.getFiles({
            prefix: `${user.id}/${parentFolderId}/verification/`
        });

        const now = Date.now();
        let cleanedCount = 0;

        // Check each file's creation time and delete if older than maxAgeHours
        for (const file of files) {
            const [metadata] = await file.getMetadata();
            const creationTime = new Date(metadata.timeCreated || 0).getTime();
            const ageHours = (now - creationTime) / (1000 * 60 * 60);

            if (ageHours > maxAgeHours) {
                await file.delete();
                cleanedCount++;
            }
        }

        return { error: null, cleanedCount };
    } catch (err) {
        console.error("Error cleaning up verification files:", err);
        return { error: "Failed to clean up verification files", cleanedCount: 0 };
    }
}
