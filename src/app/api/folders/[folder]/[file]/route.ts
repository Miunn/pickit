import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
import { FileService } from "@/data/file-service";
import { SecureService } from "@/data/secure/secure-service";
import { FilePermission } from "@/data/secure/file";
import { contentTypeFromExtension, gcsFileResponse } from "@/lib/gcs-response";

export async function GET(
	req: NextRequest,
	props: { params: Promise<{ file: string; folder: string }> }
): Promise<NextResponse> {
	const params = await props.params;
	const shareToken = req.nextUrl.searchParams.get("share");
	const accessKey = req.nextUrl.searchParams.get("h");

	const searchParams = req.nextUrl.searchParams;
	const shouldDownload = searchParams.get("download") === "true";

	const file = await FileService.get({
		where: { id: params.file, folderId: params.folder },
		include: { folder: { include: { accessTokens: true } } },
	});

	if (!file) {
		return NextResponse.json({ error: "File not found" }, { status: 404 });
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
			{ status: 400 }
		);
	}

	return gcsFileResponse(GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.id}`), {
		"Content-Type": contentTypeFromExtension(file.extension),
		"Cache-Control": "private, max-age=2592000, immutable",
		"Content-Disposition": shouldDownload
			? `attachment; filename=${encodeURIComponent(file.name)}.${encodeURIComponent(file.extension)}`
			: "inline",
	});
}
