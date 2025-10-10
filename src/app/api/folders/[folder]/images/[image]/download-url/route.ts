import { NextRequest, NextResponse } from "next/server";
import { generateV4DownloadUrl } from "@/lib/bucket";
import { isAllowedToAccessFile } from "@/lib/dal";
import { FileService } from "@/data/file-service";

export async function GET(req: NextRequest, props: { params: Promise<{ folder: string; image: string }> }) {
    const params = await props.params;
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");

    if (!isAllowedToAccessFile(params.image, shareToken, accessKey)) {
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
        return Response.json({ error: "No images found in this folder" }, { status: 404 });
    }

    const signedUrl = await generateV4DownloadUrl(`${image.createdById}/${image.folderId}/${image.id}`);
    return NextResponse.json({ url: signedUrl });
}
