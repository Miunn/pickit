import { GoogleBucket } from "@/lib/bucket";
import { NextRequest, NextResponse } from "next/server";
import { FileService } from "@/data/file-service";
import { webStreamFromFile } from "@/lib/utils";
import { SecureService } from "@/data/secure/secure-service";
import { FilePermission } from "@/data/secure/file";

/**
 * Serves a video's thumbnail stream or an authentication/error JSON response.
 *
 * Retrieves folder and video identifiers from props, validates access using query
 * parameters, and returns a NextResponse that streams the requested thumbnail
 * from Google Cloud Storage with appropriate Content-Type and Cache-Control
 * headers. If access is denied or the video record is missing, returns a JSON
 * error response with status 400 or 404 respectively.
 *
 * @param req - The incoming NextRequest (used for query parameters `share` and `h`)
 * @param props - Object containing `params`, a Promise that resolves to `{ folder, video }`
 * @returns A NextResponse whose body is the streamed thumbnail data with headers:
 *          `Content-Type: image/jpeg` and `Cache-Control: private, max-age=2592000, immutable`,
 *          or a JSON error response with status 400 (authentication required) or 404 (not found).
 */
export async function GET(req: NextRequest, props: { params: Promise<{ folder: string; video: string }> }) {
	const params = await props.params;
	const shareToken = req.nextUrl.searchParams.get("share");
	const accessKey = req.nextUrl.searchParams.get("h");

	const video = await FileService.get({
		where: {
			id: params.video,
			folderId: params.folder,
		},
		include: { folder: { include: { accessTokens: true } } },
	});

	const isAllowed = await SecureService.file.enforce(video, FilePermission.READ, shareToken, accessKey);
	if (!isAllowed) {
		return Response.json(
			{ error: "You need to be authenticated or have a magic link to access this resource" },
			{ status: 400 }
		);
	}

	if (!video) {
		return Response.json({ error: "No videos found in this folder" }, { status: 404 });
	}

	const file = GoogleBucket.file(`${video.createdById}/${video.folderId}/${video.thumbnail}`);

	const webStream = webStreamFromFile(file);

	const res = new NextResponse(webStream, {
		headers: {
			"Content-Type": "image/jpeg",
			"Cache-Control": "private, max-age=2592000, immutable",
		},
	});

	return res;
}
