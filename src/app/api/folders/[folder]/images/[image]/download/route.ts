import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
import { isAllowedToAccessFile } from "@/lib/dal";
import { FileService } from "@/data/file-service";
import { webStreamFromFile } from "@/lib/utils";

/**
 * Serves an image file from Google Cloud Storage after validating request access.
 *
 * @param req - The incoming Next.js request (may include query parameters `share` and `h` for access).
 * @param props - An object whose `params` promise resolves to route params.
 * @param props.params - Resolved route parameters: `folder` is the folder ID and `image` is the image ID.
 * @returns A NextResponse that either contains the image stream with Content-Type, Content-Length, and Content-Disposition headers, or a JSON error response with HTTP status 400 (access denied) or 404 (image not found).
 */
export async function GET(req: NextRequest, props: { params: Promise<{ folder: string; image: string }> }) {
	const params = await props.params;
	const shareToken = req.nextUrl.searchParams.get("share");
	const accessKey = req.nextUrl.searchParams.get("h");

	const isAllowed = await isAllowedToAccessFile(params.image, shareToken, accessKey);

	if (!isAllowed) {
		return Response.json(
			{ error: "You need to be authenticated or have a magic link to access this resource" },
			{ status: 400 }
		);
	}

	const image = await FileService.get({
		where: {
			id: params.image,
			folderId: params.folder,
		},
	});

	if (!image) {
		return Response.json({ error: "Image not found" }, { status: 404 });
	}

	const file = GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`);

	const webStream = webStreamFromFile(file);

	const res = new NextResponse(webStream, {
		headers: {
			"Content-Type": "image/" + image.extension,
			"Content-Length": image.size.toString(),
			"Content-Disposition": `attachment; filename=${encodeURIComponent(image.name)}.${encodeURIComponent(image.extension)}`,
		},
	});
	return res;
}
