"use server"

import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { FileLightWithFolderName, FileWithComments, FileWithFolder, RenameImageFormSchema } from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { fileTypeFromBuffer } from 'file-type';
import { z } from "zod";
import { GoogleBucket } from "@/lib/bucket";
import mediaInfoFactory, { Track } from "mediainfo.js";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough, Readable } from "stream";
import crypto, { randomUUID } from "crypto";
import { validateShareToken } from "./tokenValidation";
import { FileType, PersonAccessToken, FileLike } from "@prisma/client";
import fs, { mkdtemp, mkdtempSync, rmdirSync, unlinkSync } from "fs";
import path from "path";
import { tmpdir } from "os";
import { canLikeFile, getToken, isAllowedToAccessFile } from "@/lib/dal";

ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH as string);

export async function initiateFileUpload(
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

export async function finalizeFileUpload(
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
            const image = await prisma.file.create({
                data: {
                    id: fileId,
                    name: verificationData.name.split('.')[0],
                    type: FileType.IMAGE,
                    position: (await getLastPosition(parentFolderId)) + 1000,
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
            try {
                const thumbnailBuffer = await extractThumbnailFromBuffer(uploadedBuffer);
                console.log("Thumbnail buffer created");
                console.log("Buffer", thumbnailBuffer);
                // Log buffer size
                console.log("Thumbnail buffer size:", thumbnailBuffer.length);
                // Save thumbnail
                await GoogleBucket.file(`${session.user.id}/${parentFolderId}/${fileId}-thumbnail`).save(thumbnailBuffer);
            } catch (err) {
                console.error("Error creating thumbnail:", err);
            }

            // Create video record
            const mediainfo = await mediaInfoFactory({ locateFile: (file) => `${process.env.NEXT_PUBLIC_APP_URL}/mediainfo/${file}` });
            const metadata = await mediainfo.analyzeData(uploadedBuffer.length, () => uploadedBuffer);
            mediainfo.close();
            const video = await prisma.file.create({
                data: {
                    id: fileId,
                    name: verificationData.name.split('.')[0],
                    type: FileType.VIDEO,
                    size: verificationData.size,
                    position: (await getLastPosition(parentFolderId)) + 1000,
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
        return await finalizeFileUpload(formData, parentFolderId);
    } else {
        return await initiateFileUpload(formData, parentFolderId);
    }
}

export async function getImagesWithFolderAndCommentsFromFolder(folderId: string): Promise<{
    images: (FileWithFolder & FileWithComments)[],
    error: string | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to load files from folder", images: [] }
    }

    const files = await prisma.file.findMany({
        where: {
            folder: { id: folderId },
            createdBy: { id: user.id },
            type: FileType.IMAGE
        },
        include: {
            folder: true,
            comments: { include: { createdBy: true } }
        }
    });

    return { error: null, images: files };
}

export async function renameFile(fileId: string, data: z.infer<typeof RenameImageFormSchema>): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to rename files" };
    }

    const parsedData = RenameImageFormSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: "invalid-data" };
    }

    try {
        const image = await prisma.file.update({
            where: { id: fileId, createdBy: { id: user.id } },
            data: { name: parsedData.data.name }
        });
        revalidatePath(`/app/folders/${image.folderId}`);
    } catch (err) {
        console.error("Error renaming image:", err);
        return { error: "Image not found" };
    }

    revalidatePath("/app");
    return { error: null };
}

export async function updateFileDescription(fileId: string, description: string): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to update file description" };
    }

    const image = await prisma.file.update({
        where: { id: fileId, createdBy: { id: user.id } },
        data: { description }
    });

    revalidatePath(`/app/folders/${image.folderId}`);
    return { error: null };
}

export async function likeFile(fileId: string, shareToken?: string | null, accessKey?: string | null): Promise<{ error: string | null, like?: FileLike, liked?: boolean }> {
    if (!canLikeFile(fileId, shareToken, accessKey, "personAccessToken")) {
        return { error: "You do not have permission to like this file" };
    }
    
    const file = await prisma.file.findUnique({
        where: { id: fileId }
    });

    if (!file) {
        return { error: "File not found" };
    }

    const { user } = await getCurrentSession();

    if (user) {
        const existingLike = await prisma.fileLike.findFirst({
            where: { fileId, createdById: user.id }
        });

        if (existingLike) {
            const like = await prisma.fileLike.delete({ where: { id: existingLike.id } });
            return { error: null, like: like, liked: false };
        }

        const file = await prisma.file.update({
            where: { id: fileId },
            data: { likes: { create: { createdById: user.id, createdByEmail: user.email } } },
            select: { likes: true }
        });

        return { error: null, like: file.likes[file.likes.length - 1], liked: true };
    } else if (shareToken) {
        const token = await getToken(shareToken, "personAccessToken") as PersonAccessToken;

        if (!token) {
            return { error: "Invalid share token" };
        }

        const existingLike = await prisma.fileLike.findFirst({
            where: { fileId, createdByEmail: token.email }
        });

        if (existingLike) {
            const like = await prisma.fileLike.delete({ where: { id: existingLike.id } });
            return { error: null, like: like, liked: false };
        }

        const like = await prisma.file.update({
            where: { id: fileId },
            data: { likes: { create: { createdByEmail: token.email } } },
            select: { likes: true }
        });

        return { error: null, like: like.likes[like.likes.length - 1], liked: true };
    } else {
        return { error: "You don't have permission to like this file" };
    }
}

export async function updateFilePosition(fileId: string, previousId?: string, nextId?: string): Promise<{ error: string | null, newPosition?: number }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to update file position" };
    }

    const file = await prisma.file.findUnique({
        where: { id: fileId, createdById: user.id }
    });

    let previousFile = null;
    let nextFile = null;

    if (previousId) {
        previousFile = await prisma.file.findUnique({
            where: { id: previousId, createdById: user.id }
        });
    }

    if (nextId) {
        nextFile = await prisma.file.findUnique({
            where: { id: nextId, createdById: user.id }
        });
    }

    if (!file || (previousId && !previousFile) || (nextId && !nextFile)) {
        return { error: "File not found" };
    }

    if ((previousFile && previousFile.folderId !== file.folderId) || (nextFile && nextFile.folderId !== file.folderId)) {
        return { error: "File not found" };
    }

    if (previousFile && nextFile && previousFile.position > nextFile.position) {
        return { error: "Previous file position must be less than next file position" };
    }

    if (nextFile && previousFile && nextFile.position - previousFile.position < 2) {
        await reNormalizePositions(file.folderId);
        return updateFilePosition(fileId, previousId, nextId);
    }


    let position = 1;
    // Handle start inserting edge case
    if (!previousFile && nextFile && nextFile.position < 2) {
        await reNormalizePositions(file.folderId);
        position = 500;
    } else if (!previousFile && nextFile) {
        position = nextFile.position / 2;
    }

    if (!nextFile && previousFile) {
        position = previousFile.position + 1000;
    }

    if (previousFile && nextFile) {
        position = (nextFile.position + previousFile.position) / 2;
    }

    try {
        await prisma.file.update({
            where: { id: fileId },
            data: { position }
        });
    } catch (err) {
        console.error("Error updating file position:", err);
        return { error: "Failed to update file position" };
    }

    return { error: null, newPosition: position };
}

export async function deleteFile(fileId: string, shareToken?: string, hashPin?: string, tokenType?: string) {
    const isAllowed = await isAllowedToAccessFile(fileId, shareToken, hashPin, tokenType);

    if (!isAllowed) {
        return { error: "You do not have permission to delete this file" };
    }

    // Check if user is authorized to delete this image
    // (User was the creator of the folder containing the image)

    const file = await prisma.file.findUnique({
        where: { id: fileId }
    });

    if (!file) {
        return { error: "File not found" };
    }

    if (file.type === FileType.VIDEO) {
        await GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.thumbnail}`).delete();
    }

    await GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.id}`).delete();

    await prisma.file.delete({
        where: { id: fileId }
    });

    revalidatePath(`/app/folders/${file.folderId}`);
    revalidatePath(`/app/folders`);
    return { error: null };
}

export async function deleteFiles(files: string[]) {
    for (const file of files) {
        await deleteFile(file);
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
        const video = await prisma.file.findUnique({
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
        const mediainfo = await mediaInfoFactory({ locateFile: (file) => `${process.env.NEXT_PUBLIC_APP_URL}/mediainfo/${file}` });
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
        await prisma.file.update({
            where: { id: videoId },
            data: {
                width: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Width || 0,
                height: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Height || 0,
                duration: metadata.media?.track.find((track: Track) => track["@type"] === "General")?.Duration || 0,
            }
        });

        revalidatePath(`/app/folders/${folderId}`);
        revalidatePath(`/app/folders`);
        revalidatePath(`/app`);

        return { error: null };
    } catch (err) {
        console.error("Error processing video after upload:", err);
        return { error: "Failed to process video after upload" };
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

async function getLastPosition(folderId: string) {
    const file = await prisma.file.findFirst({
        where: { folderId },
        orderBy: { position: "desc" }
    });
    return file?.position || 0;
}

async function reNormalizePositions(folderId: string) {
    const files = await prisma.file.findMany({
        where: { folderId },
        orderBy: { position: "asc" }
    });

    for (let i = 0; i < files.length; i++) {
        await prisma.file.update({
            where: { id: files[i].id },
            data: { position: 1000 + i * 1000 }
        });
    }
}

async function extractThumbnailFromBuffer(videoBuffer: Buffer): Promise<Buffer> {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'thumb-'));
    const inputPath = path.join(tempDir, `input-${randomUUID()}.video`);
    const outputPath = path.join(tempDir, `thumbnail-${randomUUID()}.jpg`);

    console.log("Temp dir", tempDir);
    console.log("inputPath", inputPath);
    console.log("outputPath", outputPath);
    
    try {
        // Write video buffer to a temp file
        fs.writeFileSync(inputPath, videoBuffer);

        // Run FFmpeg to extract a single frame at timestamp
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .seekInput('00:00:00')
                .outputOptions(['-vframes 1'])
                .output(outputPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // Read and return thumbnail buffer
        const thumbBuffer = fs.readFileSync(outputPath);
        return thumbBuffer;

    } finally {
        // Clean up temp files and directory
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            fs.rmdirSync(tempDir);
        } catch (cleanupErr) {
            console.warn('Temporary file cleanup failed:', cleanupErr);
        }
    }
}