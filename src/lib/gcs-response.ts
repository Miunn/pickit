import { NextResponse } from "next/server";
import type { File } from "@google-cloud/storage";
import { webStreamFromFile } from "@/lib/utils";

export const ONE_YEAR_SECONDS = 31536000;
export const PUBLIC_MEDIA_CACHE_CONTROL = `public, max-age=${ONE_YEAR_SECONDS}, s-maxage=${ONE_YEAR_SECONDS}, immutable`;
export const PRIVATE_NO_STORE = "private, no-store";

export function contentTypeFromExtension(extension?: string | null): string {
	const ext = (extension ?? "").toLowerCase().replace(/^\./, "");
	switch (ext) {
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "png":
			return "image/png";
		case "webp":
			return "image/webp";
		case "gif":
			return "image/gif";
		case "avif":
			return "image/avif";
		case "svg":
			return "image/svg+xml";
		case "mp4":
			return "video/mp4";
		case "webm":
			return "video/webm";
		default:
			return ext ? `application/octet-stream` : "application/octet-stream";
	}
}

function parseByteRange(rangeHeader: string | null | undefined, size: number) {
	if (!rangeHeader) {
		return null;
	}

	const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
	if (!match) {
		return null;
	}

	const [, startRaw, endRaw] = match;
	if (startRaw === "" && endRaw === "") {
		return null;
	}

	if (startRaw === "") {
		const suffixLength = Number(endRaw);
		if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
			return null;
		}
		const start = Math.max(size - suffixLength, 0);
		return { start, end: size - 1 };
	}

	const start = Number(startRaw);
	const end = endRaw === "" ? size - 1 : Number(endRaw);
	if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
		return null;
	}

	return { start, end: Math.min(end, size - 1) };
}

export async function gcsFileResponse(
	file: File,
	headers: Record<string, string> = {},
	rangeHeader?: string | null
) {
	try {
		const [exists] = await file.exists();
		if (!exists) {
			return NextResponse.json(
				{ error: "Object not found in bucket" },
				{ status: 404, headers: { "Cache-Control": PRIVATE_NO_STORE } }
			);
		}

		const [metadata] = await file.getMetadata();
		const contentType = headers["Content-Type"] || metadata.contentType || "application/octet-stream";
		const size = metadata.size ? Number(metadata.size) : undefined;
		const range = size !== undefined ? parseByteRange(rangeHeader, size) : null;
		const responseHeaders: Record<string, string> = {
			...headers,
			"Content-Type": contentType,
			"Accept-Ranges": "bytes",
		};

		if (range && size !== undefined) {
			responseHeaders["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
			responseHeaders["Content-Length"] = String(range.end - range.start + 1);
			return new NextResponse(webStreamFromFile(file, range), {
				status: 206,
				headers: responseHeaders,
			});
		}

		if (size !== undefined) {
			responseHeaders["Content-Length"] = String(size);
		}

		return new NextResponse(webStreamFromFile(file), { headers: responseHeaders });
	} catch (error) {
		console.error("GCS read failed", error);
		return NextResponse.json(
			{ error: "Failed to read file from storage" },
			{ status: 502, headers: { "Cache-Control": PRIVATE_NO_STORE } }
		);
	}
}
