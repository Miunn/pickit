import { Storage } from "@google-cloud/storage";

const googleCloudStorage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE
})

export const GoogleBucket = googleCloudStorage.bucket(process.env.GCP_BUCKET_NAME as string);

export const generateV4UploadUrl = async (fileName: string) => {
    const [url] = await GoogleBucket.file(fileName).getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    return url;
}
