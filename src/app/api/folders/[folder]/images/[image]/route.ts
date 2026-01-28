import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
import { isAllowedToAccessFile } from "@/data/dal";
import { FileService } from "@/data/file-service";
import { webStreamFromFile } from "@/lib/utils";

export async function GET(req: NextRequest, props: { params: Promise<{ image: string }> }): Promise<NextResponse> {
	const params = await props.params;
	const shareToken = req.nextUrl.searchParams.get("share");
	const accessKey = req.nextUrl.searchParams.get("h");

	if (!(await isAllowedToAccessFile(params.image, shareToken, accessKey))) {
		return NextResponse.json(
			{ error: "You need to be authenticated or have a magic link to access this resource" },
			{ status: 400 }
		);
	}

	const image = await FileService.get({
		where: { id: params.image },
		select: { createdById: true, folderId: true, id: true, extension: true },
	});

	if (!image) {
		return NextResponse.json({ error: "Image not found" });
	}

	const file = GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`);

	const webStream = webStreamFromFile(file);

	const res = new NextResponse(webStream, {
		headers: {
			"Content-Type": "image/" + image.extension,
			"Cache-Control": "private, max-age=2592000, immutable",
		},
	});

	return res;
}
