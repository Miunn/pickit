import "server-only";
import { Storage, type Bucket } from "@google-cloud/storage";

function createBucket(): Bucket {
	const name = process.env.GCP_BUCKET_NAME;
	if (!name) {
		throw new Error("GCP_BUCKET_NAME is not set");
	}

	const storage = new Storage({
		projectId: process.env.GCP_PROJECT_ID,
		...(process.env.GCP_KEY_FILE ? { keyFilename: process.env.GCP_KEY_FILE } : {}),
	});

	return storage.bucket(name);
}

let bucket: Bucket | undefined;

export const GoogleBucket: Bucket = new Proxy({} as Bucket, {
	get(_target, prop) {
		bucket ??= createBucket();
		const value = Reflect.get(bucket, prop, bucket);
		return typeof value === "function" ? value.bind(bucket) : value;
	},
});

export const generateV4UploadUrl = async (fileName: string) => {
	const [url] = await GoogleBucket.file(fileName).getSignedUrl({
		version: "v4",
		action: "write",
		expires: Date.now() + 15 * 60 * 1000, // 15 minutes
	});
	return url;
};

export const generateV4DownloadUrl = async (fileName: string) => {
	const [url] = await GoogleBucket.file(fileName).getSignedUrl({
		version: "v4",
		action: "read",
		expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
	});
	return url;
};
