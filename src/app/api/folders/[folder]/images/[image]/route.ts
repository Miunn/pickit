import { NextRequest, NextResponse } from "next/server";
import { generateV4DownloadUrl } from "@/lib/bucket";
import { isAllowedToAccessFile } from "@/lib/dal";
import { FileService } from "@/data/file-service";

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
    });

    if (!image) {
        return NextResponse.json({ error: "Image not found" });
    }

    const url = await generateV4DownloadUrl(`${image.createdById}/${image.folderId}/${image.id}`);

    return NextResponse.redirect(url);
}
