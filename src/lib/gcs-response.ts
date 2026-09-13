import { NextResponse } from "next/server";
import type { File } from "@google-cloud/storage";
import { webStreamFromFile } from "@/lib/utils";

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

export async function gcsFileResponse(file: File, headers: Record<string, string> = {}) {
	try {
		const [exists] = await file.exists();
		if (!exists) {
			return NextResponse.json({ error: "Object not found in bucket" }, { status: 404 });
		}

		const [metadata] = await file.getMetadata();
		const contentType = headers["Content-Type"] || metadata.contentType || "application/octet-stream";
		const responseHeaders: Record<string, string> = {
			...headers,
			"Content-Type": contentType,
		};
		if (metadata.size) {
			responseHeaders["Content-Length"] = String(metadata.size);
		}

		return new NextResponse(webStreamFromFile(file), { headers: responseHeaders });
	} catch (error) {
		console.error("GCS read failed", error);
		return NextResponse.json({ error: "Failed to read file from storage" }, { status: 502 });
	}
}
