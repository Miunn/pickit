import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
import { FileService } from "@/data/file-service";
import { webStreamFromFile } from "@/lib/utils";
import { SecureService } from "@/data/secure/secure-service";
import { FilePermission } from "@/data/secure/file";

/**
 * Streams a video file from Google Cloud Storage and returns it as an HTTP response.
 *
 * @param req - The incoming Next.js request; query may include `share` (magic link token) and `h` (access key).
 * @param props - An object whose `params` promise resolves to route parameters `{ folder, video }` identifying the requested file.
 * @returns A NextResponse whose body is the video's readable stream and which includes `Content-Type`, `Content-Length`, and `Content-Disposition` headers. If access is denied, returns a JSON error with status 400. If the video is not found, returns a JSON error with status 404.
 */
export async function GET(req: NextRequest, props: { params: Promise<{ folder: string; video: string }> }) {
	const params = await props.params;
	const shareToken = req.nextUrl.searchParams.get("share");
	const accessKey = req.nextUrl.searchParams.get("h");

	const file = await FileService.get({
		where: {
			id: params.video,
			folderId: params.folder,
		},
		include: { folder: { include: { accessTokens: true } } },
	});

	if (!file) {
		return Response.json({ error: "Video not found" }, { status: 404 });
	}

	const isAllowed = await SecureService.file.enforce(
		file,
		FilePermission.READ,
		shareToken || undefined,
		accessKey || undefined
	);

	if (!isAllowed) {
		return Response.json(
			{ error: "You need to be authenticated or have a magic link to access this resource" },
			{ status: 400 }
		);
	}

	const bucketFile = GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.id}`);

	const webStream = webStreamFromFile(bucketFile);

	const res = new NextResponse(webStream, {
		headers: {
			"Content-Type": "video/" + file.extension,
			"Content-Length": file.size.toString(),
			"Content-Disposition": `attachment; filename=${encodeURIComponent(file.name)}.${encodeURIComponent(file.extension)}`,
		},
	});

	return res;
}
