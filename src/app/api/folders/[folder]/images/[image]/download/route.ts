import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
import { FileService } from "@/data/file-service";
import { webStreamFromFile } from "@/lib/utils";
import { SecureService } from "@/data/secure/secure-service";
import { FilePermission } from "@/data/secure/file";

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

	const file = await FileService.get({
		where: {
			id: params.image,
			folderId: params.folder,
		},
		include: { folder: { include: { accessTokens: true } } },
	});

	if (!file) {
		return Response.json({ error: "Image not found" }, { status: 404 });
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
			"Content-Type": "image/" + file.extension,
			"Content-Length": file.size.toString(),
			"Content-Disposition": `attachment; filename=${encodeURIComponent(file.name)}.${encodeURIComponent(file.extension)}`,
		},
	});
	return res;
}
