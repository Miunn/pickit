"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import {
    FileWithComments,
    FileWithFolder,
    FileWithLikes,
    FileWithTags,
    FolderWithFilesCount,
    FolderWithTags,
    RenameImageFormSchema,
} from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import { generateV4DownloadUrl, GoogleBucket } from "@/lib/bucket";
import mediaInfoFactory, { Track } from "mediainfo.js";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import crypto, { randomUUID } from "crypto";
import { FileType, FileLike, FolderTokenPermission } from "@prisma/client";
import fs, { mkdtempSync } from "fs";
import path from "path";
import { tmpdir } from "os";
import { canLikeFile, isAccessWithTokenValid, isAllowedToAccessFile } from "@/lib/dal";
import exifr from "exifr";
import { AccessTokenService } from "@/data/access-token-service";
import { FolderService } from "@/data/folder-service";
import { FileService } from "@/data/file-service";
import { FileLikeService } from "@/data/file-like-service";

ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH as string);

export async function initiateFileUpload(
    formData: FormData,
    parentFolderId: string,
    token?: string,
    key?: string
): Promise<{
    error: string | null;
    uploadUrl: string | null;
    verificationToken?: string;
    fileId?: string;
}> {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
        // Verify if valid token is provided for unauthenticated users
        if (!token) {
            return { error: "not-authenticated", uploadUrl: null };
        }

        const accessToken = await AccessTokenService.get({
            where: { token },
            include: { folder: true },
        });

        console.log("Access token", accessToken);

        if (
            !accessToken ||
            accessToken.folderId !== parentFolderId ||
            !(await isAccessWithTokenValid(token, key, FolderTokenPermission.WRITE))
        ) {
            console.log("Access token invalid");
            return { error: "not-authenticated", uploadUrl: null };
        }
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
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const fileId = crypto.randomBytes(16).toString("hex");

    const folderUserId = await FolderService.get({
        where: { id: parentFolderId },
        select: { createdById: true },
    });

    if (!folderUserId) {
        return { error: "folder-not-found", uploadUrl: null };
    }

    // Save verification data to cloud storage
    const verificationData = {
        name: fileName,
        size: fileSize,
        type: fileType,
        samples: JSON.parse(fileSamples), // Parse the samples array
        userId: folderUserId.createdById,
        timestamp: Date.now(),
    };

    try {
        await GoogleBucket.file(
            `${folderUserId.createdById}/${parentFolderId}/verification/${verificationToken}.json`
        ).save(JSON.stringify(verificationData), {
            metadata: {
                contentType: "application/json",
                metadata: {
                    userId: folderUserId.createdById,
                    folderId: parentFolderId,
                    fileId: fileId,
                },
            },
        });
        console.log("Uploaded verification");

        // Generate signed URL for upload
        const [uploadUrl] = await GoogleBucket.file(
            `${folderUserId.createdById}/${parentFolderId}/${fileId}`
        ).getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: fileType,
        });

        return {
            error: null,
            uploadUrl,
            verificationToken,
            fileId,
        };
    } catch (err) {
        console.error("Error initiating upload:", err);
        return { error: "upload-initiation-failed", uploadUrl: null };
    }
}

export async function finalizeFileUpload(
    formData: FormData,
    parentFolderId: string,
    token?: string,
    key?: string
): Promise<{
    error: string | null;
    file:
        | (FileWithTags &
              FileWithComments &
              FileWithLikes & { folder: FolderWithFilesCount & FolderWithTags } & {
                  signedUrl: string;
              })
        | null;
}> {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
        // Verify if valid token is provided for unauthenticated users
        if (!token) {
            return { error: "not-authenticated", file: null };
        }

        const accessToken = await AccessTokenService.get({
            where: { token },
            include: { folder: true },
        });

        if (
            !accessToken ||
            accessToken.folderId !== parentFolderId ||
            !(await isAccessWithTokenValid(token, key, FolderTokenPermission.WRITE))
        ) {
            return { error: "not-authenticated", file: null };
        }
    }

    const verificationToken = formData.get("verificationToken") as string;
    const fileId = formData.get("fileId") as string;

    if (!verificationToken || !fileId) {
        return { error: "missing-verification-data", file: null };
    }

    const folderUserId = await FolderService.get({
        where: { id: parentFolderId },
        select: { createdById: true },
    });

    if (!folderUserId) {
        return { error: "folder-not-found", file: null };
    }

    try {
        // Get verification data
        const [verificationFile] = await GoogleBucket.file(
            `${folderUserId.createdById}/${parentFolderId}/verification/${verificationToken}.json`
        ).download();
        const verificationData = JSON.parse(verificationFile.toString());

        // Verify metadata
        if (verificationData.userId !== folderUserId.createdById) {
            return { error: "verification-failed", file: null };
        }

        // Get the uploaded file
        const [uploadedFile] = await GoogleBucket.file(
            `${folderUserId.createdById}/${parentFolderId}/${fileId}`
        ).download();
        const uploadedBuffer = Buffer.from(uploadedFile);

        // Verify file type
        const detectedType = await fileTypeFromBuffer(uploadedBuffer);
        if (!detectedType || detectedType.mime !== verificationData.type) {
            await GoogleBucket.file(`${folderUserId.createdById}/${parentFolderId}/${fileId}`).delete();
            return { error: "file-type-mismatch", file: null };
        }

        // Verify file size
        if (uploadedBuffer.length !== verificationData.size) {
            await GoogleBucket.file(`${folderUserId.createdById}/${parentFolderId}/${fileId}`).delete();
            return { error: "file-size-mismatch", file: null };
        }

        // Verify file samples
        const sampleSize = 1024 * 1024; // 1MB
        const samples = verificationData.samples;
        for (let i = 0; i < samples.length; i++) {
            const start = i * sampleSize;
            const end = Math.min(start + sampleSize, uploadedBuffer.length);
            const sample = uploadedBuffer.slice(start, end);
            const sampleHash = crypto.createHash("sha256").update(sample).digest("base64");

            if (sampleHash !== samples[i]) {
                await GoogleBucket.file(`${folderUserId.createdById}/${parentFolderId}/${fileId}`).delete();
                return { error: "file-content-mismatch", file: null };
            }
        }

        // Delete verification file
        await GoogleBucket.file(
            `${folderUserId.createdById}/${parentFolderId}/verification/${verificationToken}.json`
        ).delete();

        // Create database record
        if (verificationData.type.startsWith("image/")) {
            const metadata = await sharp(uploadedBuffer).metadata();
            const exif = await exifr.parse(uploadedBuffer, true);
            const image = await FileService.create(
                {
                    id: fileId,
                    name: verificationData.name.split(".")[0],
                    type: FileType.IMAGE,
                    position: (await getLastPosition(parentFolderId)) + 1000,
                    size: verificationData.size,
                    folder: { connect: { id: parentFolderId } },
                    createdBy: { connect: { id: folderUserId.createdById } },
                    extension: verificationData.name.split(".").pop() || "",
                    width: metadata.width || 0,
                    height: metadata.height || 0,
                    make: exif.Make,
                    model: exif.Model,
                    software: exif.Software,
                    orientation: exif.Orientation?.toString(),
                    exposureTime: exif.ExposureTime,
                    fNumber: exif.FNumber,
                    iso: exif.ISO,
                    focalLength: exif.FocalLength,
                    flash: exif.Flash,
                    takenAt: exif.TakenAt,
                    modifiedAt: exif.ModifiedAt,
                    contrast: exif.Contrast,
                    saturation: exif.Saturation,
                    sharpness: exif.Sharpness,
                    whiteBalance: exif.WhiteBalance,
                    altitude: exif.GPSAltitude,
                    latitude: exif.latitude,
                    longitude: exif.longitude,
                },
                {
                    tags: true,
                    comments: { include: { createdBy: true } },
                    likes: true,
                    folder: {
                        include: { tags: true, _count: { select: { files: true } } },
                    },
                }
            );
            revalidatePath(`/app/folders/${parentFolderId}`);
            revalidatePath(`/app/folders`);
            revalidatePath(`/app`);

            const signedUrl = await generateV4DownloadUrl(`${folderUserId.createdById}/${parentFolderId}/${fileId}`);
            return { error: null, file: { ...image, signedUrl } };
        } else if (verificationData.type.startsWith("video/")) {
            // Process thumbnail creation
            try {
                const thumbnailBuffer = await extractThumbnailFromBuffer(uploadedBuffer);
                console.log("Thumbnail buffer created");
                console.log("Buffer", thumbnailBuffer);
                // Log buffer size
                console.log("Thumbnail buffer size:", thumbnailBuffer.length);
                // Save thumbnail
                await GoogleBucket.file(`${folderUserId.createdById}/${parentFolderId}/${fileId}-thumbnail`).save(
                    thumbnailBuffer
                );
            } catch (err) {
                console.error("Error creating thumbnail:", err);
            }

            // Create video record
            const mediainfo = await mediaInfoFactory({
                locateFile: file => `${process.env.NEXT_PUBLIC_APP_URL}/mediainfo/${file}`,
            });
            const metadata = await mediainfo.analyzeData(uploadedBuffer.length, () => uploadedBuffer);
            mediainfo.close();
            const video = await FileService.create(
                {
                    id: fileId,
                    name: verificationData.name.split(".")[0],
                    type: FileType.VIDEO,
                    size: verificationData.size,
                    position: (await getLastPosition(parentFolderId)) + 1000,
                    folder: { connect: { id: parentFolderId } },
                    createdBy: { connect: { id: folderUserId.createdById } },
                    extension: verificationData.name.split(".").pop() || "",
                    thumbnail: `${fileId}-thumbnail`,
                    width: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Width || 0,
                    height:
                        metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Height || 0,
                    duration: metadata.media?.track.find((track: Track) => track["@type"] === "General")?.Duration || 0,
                },
                {
                    tags: true,
                    comments: { include: { createdBy: true } },
                    likes: true,
                    folder: {
                        include: { tags: true, _count: { select: { files: true } } },
                    },
                }
            );

            revalidatePath(`/app/folders/${parentFolderId}`);
            revalidatePath(`/app/folders`);
            revalidatePath(`/app`);

            const signedUrl = await generateV4DownloadUrl(`${folderUserId.createdById}/${parentFolderId}/${fileId}`);
            return { error: null, file: { ...video, signedUrl } };
        }

        return { error: "invalid-file-type", file: null };
    } catch (err) {
        console.error("Error finalizing upload:", err);
        return { error: "upload-finalization-failed", file: null };
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
    images: (FileWithFolder & FileWithComments)[];
    error: string | null;
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return {
            error: "You must be logged in to load files from folder",
            images: [],
        };
    }

    const files = await FileService.getMultiple({
        where: {
            folder: { id: folderId },
            createdBy: { id: user.id },
            type: FileType.IMAGE,
        },
        include: {
            folder: true,
            comments: { include: { createdBy: true } },
        },
    });

    return { error: null, images: files };
}

export async function renameFile(
    fileId: string,
    data: z.infer<typeof RenameImageFormSchema>
): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to rename files" };
    }

    const parsedData = RenameImageFormSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: "invalid-data" };
    }

    try {
        const image = await FileService.update(fileId, { name: parsedData.data.name });
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

    const image = await FileService.update(fileId, { description });

    revalidatePath(`/app/folders/${image.folderId}`);
    return { error: null };
}

export async function likeFile(
    fileId: string,
    shareToken?: string | null,
    accessKey?: string | null
): Promise<{ error: string | null; like?: FileLike; liked?: boolean }> {
    if (!canLikeFile(fileId, shareToken, accessKey)) {
        return { error: "You do not have permission to like this file" };
    }

    const file = await FileService.get({
        where: { id: fileId },
    });

    if (!file) {
        return { error: "File not found" };
    }

    const { user } = await getCurrentSession();

    if (user) {
        const existingLike = await FileLikeService.get({
            method: "first",
            where: { fileId, createdById: user.id },
        });

        if (existingLike) {
            const like = await FileLikeService.delete(existingLike.id);
            return { error: null, like: like, liked: false };
        }

        const file = await FileService.update(
            fileId,
            {
                likes: { create: { createdById: user.id, createdByEmail: user.email } },
            },
            { likes: true }
        );

        return {
            error: null,
            like: file.likes[file.likes.length - 1],
            liked: true,
        };
    } else if (shareToken) {
        const token = await AccessTokenService.get({
            where: { token: shareToken },
        });

        if (!token) {
            return { error: "Invalid share token" };
        }

        const existingLike = await FileLikeService.get({
            method: "first",
            where: { fileId, createdByEmail: token.email },
        });

        if (existingLike) {
            const like = await FileLikeService.delete(existingLike.id);
            return { error: null, like: like, liked: false };
        }

        const like = await FileService.update(
            fileId,
            {
                likes: { create: { createdByEmail: token.email } },
            },
            { likes: true }
        );

        return {
            error: null,
            like: like.likes[like.likes.length - 1],
            liked: true,
        };
    } else {
        return { error: "You don't have permission to like this file" };
    }
}

export async function updateFilePosition(
    fileId: string,
    previousId?: string,
    nextId?: string
): Promise<{ error: string | null; newPosition?: number }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to update file position" };
    }

    const file = await FileService.get({
        where: { id: fileId, createdById: user.id },
    });

    let previousFile = null;
    let nextFile = null;

    if (previousId) {
        previousFile = await FileService.get({
            where: { id: previousId, createdById: user.id },
        });
    }

    if (nextId) {
        nextFile = await FileService.get({
            where: { id: nextId, createdById: user.id },
        });
    }

    if (!file || (previousId && !previousFile) || (nextId && !nextFile)) {
        return { error: "File not found" };
    }

    if (
        (previousFile && previousFile.folderId !== file.folderId) ||
        (nextFile && nextFile.folderId !== file.folderId)
    ) {
        return { error: "File not found" };
    }

    if (previousFile && nextFile && previousFile.position > nextFile.position) {
        return {
            error: "Previous file position must be less than next file position",
        };
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
        await FileService.update(fileId, { position });
    } catch (err) {
        console.error("Error updating file position:", err);
        return { error: "Failed to update file position" };
    }

    return { error: null, newPosition: position };
}

export async function deleteFile(fileId: string, shareToken?: string, hashPin?: string) {
    const isAllowed = await isAllowedToAccessFile(fileId, shareToken, hashPin);

    if (!isAllowed) {
        return { error: "You do not have permission to delete this file" };
    }

    // Check if user is authorized to delete this image
    // (User was the creator of the folder containing the image)

    const file = await FileService.get({
        where: { id: fileId },
    });

    if (!file) {
        return { error: "File not found" };
    }

    if (file.type === FileType.VIDEO) {
        await GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.thumbnail}`).delete();
    }

    await GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.id}`).delete();

    await FileService.delete(fileId);

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

export async function processVideoAfterUpload(folderId: string, videoId: string): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to process video after upload" };
    }

    try {
        const video = await FileService.get({
            where: {
                id: videoId,
                folderId: folderId,
                createdById: user.id,
            },
        });

        if (!video) {
            return { error: "Video not found" };
        }

        // Download video from cloud storage
        const file = GoogleBucket.file(`${user.id}/${folderId}/${videoId}`);
        const [buffer] = await file.download();

        // Process video metadata
        const mediainfo = await mediaInfoFactory({
            locateFile: file => `${process.env.NEXT_PUBLIC_APP_URL}/mediainfo/${file}`,
        });
        const metadata = await mediainfo.analyzeData(buffer.length, () => buffer);
        mediainfo.close();

        // Extract thumbnail
        const thumbnailBuffer = await new Promise<Buffer>((resolve, reject) => {
            const inputStream = new PassThrough();
            const passThrough = new PassThrough();
            const chunks: Buffer[] = [];

            passThrough.on("data", chunk => chunks.push(chunk));
            passThrough.on("end", () => resolve(Buffer.concat(chunks)));
            passThrough.on("error", reject);

            inputStream.end(buffer);
            ffmpeg().input(inputStream).outputOptions("-frames:v 1").format("image2").pipe(passThrough, { end: true });
        });

        // Save thumbnail
        await GoogleBucket.file(`${user.id}/${folderId}/${video.thumbnail}`).save(thumbnailBuffer);

        // Update video record with metadata
        await FileService.update(videoId, {
            width: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Width || 0,
            height: metadata.media?.track.find((track: Track) => track["@type"] === "Video")?.Active_Height || 0,
            duration: metadata.media?.track.find((track: Track) => track["@type"] === "General")?.Duration || 0,
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
): Promise<{ error: string | null; cleanedCount: number }> {
    try {
        const { user } = await getCurrentSession();

        if (!user) {
            return {
                error: "You must be logged in to clean up verification files",
                cleanedCount: 0,
            };
        }

        // List all verification files in the folder
        const [files] = await GoogleBucket.getFiles({
            prefix: `${user.id}/${parentFolderId}/verification/`,
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
    const file = await FileService.get({
        where: { folderId },
        orderBy: { position: "desc" },
        method: "first",
    });
    return file?.position || 0;
}

async function reNormalizePositions(folderId: string) {
    const files = await FileService.getMultiple({
        where: { folderId },
        orderBy: { position: "asc" },
    });

    for (let i = 0; i < files.length; i++) {
        await FileService.update(files[i].id, { position: 1000 + i * 1000 });
    }
}

async function extractThumbnailFromBuffer(videoBuffer: Buffer): Promise<Buffer> {
    const tempDir = mkdtempSync(path.join(tmpdir(), "thumb-"));
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
                .seekInput("00:00:00")
                .outputOptions(["-vframes 1"])
                .output(outputPath)
                .on("end", resolve)
                .on("error", reject)
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
            console.warn("Temporary file cleanup failed:", cleanupErr);
        }
    }
}
