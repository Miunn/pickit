import { NextRequest, NextResponse } from "next/server";
import { generateV4DownloadUrl } from "@/lib/bucket";
import { FileService } from "@/data/file-service";
import { SecureService } from "@/data/secure/secure-service";
import { FilePermission } from "@/data/secure/file";

export async function GET(req: NextRequest, props: { params: Promise<{ video: string }> }): Promise<NextResponse> {
	const params = await props.params;
	const shareToken = req.nextUrl.searchParams.get("share");
	const accessKey = req.nextUrl.searchParams.get("h");

	const file = await FileService.get({
		where: { id: params.video },
		include: { folder: { include: { accessTokens: true } } },
	});

	const isAllowed = await SecureService.file.enforce(
		file,
		FilePermission.READ,
		shareToken || undefined,
		accessKey || undefined
	);

	if (!isAllowed) {
		return NextResponse.json({ error: "Access denied" }, { status: 403 });
	}

	const video = await FileService.get({
		where: { id: params.video },
	});

	if (!video) {
		return NextResponse.json({ error: "Video not found" });
	}

	const url = await generateV4DownloadUrl(`${video.createdById}/${video.folderId}/${video.id}`);

	return NextResponse.redirect(url);
}
