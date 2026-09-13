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

const SIGNED_URL_TTL_MS = 24 * 60 * 60 * 1000;

/** Round expiry to a 24h window so the same object keeps a stable URL (and cache key) for that day. */
function stableDownloadExpiry(): number {
	return Math.ceil(Date.now() / SIGNED_URL_TTL_MS) * SIGNED_URL_TTL_MS;
}

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
		expires: stableDownloadExpiry(),
	});
	return url;
};

type SignedUrlCache = Map<string, Promise<string>>;

type FilePathFields = {
	id: string;
	createdById: string;
	folderId: string;
	thumbnail?: string | null;
	medium?: string | null;
};

type FolderCoverPathFields = {
	id: string;
	createdById: string;
	coverId: string;
};

function hasFilePathFields(value: unknown): value is FilePathFields {
	if (!value || typeof value !== "object") {
		return false;
	}

	const record = value as Record<string, unknown>;
	return (
		typeof record.id === "string" &&
		typeof record.createdById === "string" &&
		typeof record.folderId === "string"
	);
}

function hasFolderCoverPath(value: unknown): value is FolderCoverPathFields {
	if (!value || typeof value !== "object") {
		return false;
	}

	const record = value as Record<string, unknown>;
	return (
		typeof record.id === "string" &&
		typeof record.createdById === "string" &&
		typeof record.coverId === "string"
	);
}

function cachedSignedUrl(objectPath: string, cache: SignedUrlCache): Promise<string> {
	const existing = cache.get(objectPath);
	if (existing) {
		return existing;
	}

	const signed = generateV4DownloadUrl(objectPath);
	cache.set(objectPath, signed);
	return signed;
}

async function withFileSignedUrls<T extends FilePathFields>(
	file: T,
	cache: SignedUrlCache
): Promise<T & { signedUrl?: string; signedThumbnailUrl?: string; signedMediumUrl?: string }> {
	try {
		const basePath = `${file.createdById}/${file.folderId}`;
		const [signedUrl, signedThumbnailUrl, signedMediumUrl] = await Promise.all([
			cachedSignedUrl(`${basePath}/${file.id}`, cache),
			file.thumbnail ? cachedSignedUrl(`${basePath}/${file.thumbnail}`, cache) : Promise.resolve(undefined),
			file.medium ? cachedSignedUrl(`${basePath}/${file.medium}`, cache) : Promise.resolve(undefined),
		]);

		return {
			...file,
			signedUrl,
			...(signedThumbnailUrl ? { signedThumbnailUrl } : {}),
			...(signedMediumUrl ? { signedMediumUrl } : {}),
		};
	} catch (error) {
		console.error("Failed to sign file URL", error);
		return file;
	}
}

const NESTED_MEDIA_KEYS = new Set(["files", "cover", "file", "folder"]);

/**
 * Attaches GCS signed read URLs to file records (and folder covers) returned from the database.
 */
export async function attachSignedUrlsToValue<T>(value: T, cache: SignedUrlCache = new Map()): Promise<T> {
	if (value === null || value === undefined) {
		return value;
	}

	if (Array.isArray(value)) {
		return Promise.all(value.map(item => attachSignedUrlsToValue(item, cache))) as Promise<T>;
	}

	if (typeof value !== "object") {
		return value;
	}

	const record = value as Record<string, unknown>;
	const next: Record<string, unknown> = { ...record };

	await Promise.all(
		Object.entries(record).map(async ([key, child]) => {
			if (NESTED_MEDIA_KEYS.has(key) && child !== null && child !== undefined) {
				next[key] = await attachSignedUrlsToValue(child, cache);
			}
		})
	);

	if (hasFilePathFields(next)) {
		return (await withFileSignedUrls(next, cache)) as T;
	}

	if (hasFolderCoverPath(next)) {
		try {
			return {
				...next,
				signedCoverUrl: await cachedSignedUrl(`${next.createdById}/${next.id}/${next.coverId}`, cache),
			} as T;
		} catch (error) {
			console.error("Failed to sign folder cover URL", error);
			return next as T;
		}
	}

	return next as T;
}
