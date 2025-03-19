import { Storage } from "@google-cloud/storage";

const googleCloudStorage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE
})

export const GoogleBucket = googleCloudStorage.bucket(process.env.GCP_BUCKET_NAME as string);