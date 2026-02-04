import { NextRequest, NextResponse } from "next/server";

/**
 * Serves an image file from Google Cloud Storage after validating request access.
 *
 * @param req - The incoming Next.js request (may include query parameters `share` and `h` for access).
 * @param props - An object whose `params` promise resolves to route params.
 * @param props.params - Resolved route parameters: `folder` is the folder ID and `image` is the image ID.
 * @returns A NextResponse that either contains the image stream with Content-Type, Content-Length, and Content-Disposition headers, or a JSON error response with HTTP status 400 (access denied) or 404 (image not found).
 */
export async function GET(req: NextRequest, props: { params: Promise<{ folder: string; video: string }> }) {
	const params = await props.params;
	const shareToken = req.nextUrl.searchParams.get("share");
	const accessKey = req.nextUrl.searchParams.get("h");

	return NextResponse.redirect(
		`/api/folders/${params.folder}/${params.video}?share=${shareToken || ""}&h=${accessKey || ""}`
	);
}
