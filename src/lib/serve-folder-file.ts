import { NextRequest, NextResponse } from "next/server";
import { FileType } from "@prisma/client";
import { FileService } from "@/data/file-service";
import { FilePermission } from "@/data/secure/file";
import { SecureService } from "@/data/secure/secure-service";
import { GoogleBucket } from "@/lib/bucket";
import {
	PRIVATE_NO_STORE,
	PUBLIC_MEDIA_CACHE_CONTROL,
	contentTypeFromExtension,
	gcsFileResponse,
} from "@/lib/gcs-response";

export type MediaVariant = "preview" | "medium" | "original";

const NO_STORE_HEADERS = { "Cache-Control": PRIVATE_NO_STORE };

export function parseMediaVariant(value?: string | null): MediaVariant {
	if (value === "preview" || value === "medium" || value === "original") {
		return value;
	}

	const base = (value ?? "").split(".")[0];
	if (base === "preview" || base === "medium" || base === "original") {
		return base;
	}

	return "original";
}

function objectNameForVariant(
	file: { id: string; thumbnail?: string | null; medium?: string | null },
	variant: MediaVariant
) {
	if (variant === "preview" && file.thumbnail) {
		return file.thumbnail;
	}

	if (variant === "medium" && file.medium) {
		return file.medium;
	}

	return file.id;
}

function contentTypeForVariant(
	file: { id: string; extension: string; type: FileType; thumbnail?: string | null; medium?: string | null },
	variant: MediaVariant,
	objectName: string
) {
	if (objectName === file.id) {
		return contentTypeFromExtension(file.extension);
	}

	if (variant === "preview" && file.type === FileType.VIDEO) {
		return "image/jpeg";
	}

	if (variant === "preview" || variant === "medium") {
		return "image/webp";
	}

	return contentTypeFromExtension(file.extension);
}

export async function serveFolderFile(
	req: NextRequest,
	folderId: string,
	fileId: string,
	options: { variant?: MediaVariant; download?: boolean } = {}
) {
	const shareToken = req.nextUrl.searchParams.get("share");
	const accessKey = req.nextUrl.searchParams.get("h");
	const variant = options.variant ?? parseMediaVariant(req.nextUrl.searchParams.get("v"));
	const download = options.download ?? req.nextUrl.searchParams.get("download") === "true";

	const file = await FileService.get({
		where: { id: fileId, folderId },
		include: { folder: { include: { accessTokens: true } } },
	});

	if (!file) {
		return NextResponse.json({ error: "File not found" }, { status: 404, headers: NO_STORE_HEADERS });
	}

	const isAllowed = await SecureService.file.enforce(
		file,
		FilePermission.READ,
		shareToken || undefined,
		accessKey || undefined
	);

	if (!isAllowed) {
		return NextResponse.json(
			{ error: "You need to be authenticated or have a magic link to access this resource" },
			{ status: 400, headers: NO_STORE_HEADERS }
		);
	}

	const objectName = objectNameForVariant(file, variant);
	const cacheControl = download ? PRIVATE_NO_STORE : PUBLIC_MEDIA_CACHE_CONTROL;

	return gcsFileResponse(
		GoogleBucket.file(`${file.createdById}/${file.folderId}/${objectName}`),
		{
			"Content-Type": contentTypeForVariant(file, variant, objectName),
			"Cache-Control": cacheControl,
			"CDN-Cache-Control": cacheControl,
			"Cloudflare-CDN-Cache-Control": cacheControl,
			"Content-Disposition": download
				? `attachment; filename=${encodeURIComponent(file.name)}.${encodeURIComponent(file.extension)}`
				: "inline",
		},
		req.headers.get("range")
	);
}
