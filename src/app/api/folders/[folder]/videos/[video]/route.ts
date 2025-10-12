import { NextRequest, NextResponse } from "next/server";
import { generateV4DownloadUrl } from "@/lib/bucket";
import { FileService } from "@/data/file-service";
import { isAllowedToAccessFile } from "@/lib/dal";

export async function GET(req: NextRequest, props: { params: Promise<{ video: string }> }): Promise<NextResponse> {
    const params = await props.params;
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");

    if (!(await isAllowedToAccessFile(params.video, shareToken, accessKey))) {
        return NextResponse.json(
            { error: "You need to be authenticated or have a magic link to access this resource" },
            { status: 400 }
        );
    }

    const video = await FileService.get({
        where: { id: params.video },
    });

    if (!video) {
        return NextResponse.json({ error: "Image not found" });
    }

    const url = await generateV4DownloadUrl(`${video.createdById}/${video.folderId}/${video.id}`);

    return NextResponse.redirect(url);
}
