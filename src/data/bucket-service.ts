import { GoogleBucket } from "@/lib/bucket";
import "server-only";

async function getUploadUrl(filename: string) {
    const [url] = await GoogleBucket.file(filename).getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    return url;
}

async function getDownloadUrl(filename: string) {
    const [url] = await GoogleBucket.file(filename).getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    return url;
}

async function deleteFile(filename: string) {
    try {
        await GoogleBucket.file(filename).delete();
        return true;
    } catch (error) {
        console.error("Error deleting file:", error);
        return false;
    }
}

export const BucketService = {
    getUploadUrl,
    getDownloadUrl,
    deleteFile,
};
