import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
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

    const file = GoogleBucket.file(`${video.createdById}/${video.folderId}/${video.id}`);
    const [buffer] = await file.download();
    const res = new NextResponse(buffer);
    res.headers.set("Content-Disposition", "inline");
    res.headers.set("Content-Type", `video/${video.extension}`);
    return res;
}
