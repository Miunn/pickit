import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
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
        select: { createdById: true, folderId: true, id: true, extension: true },
    });

    if (!image) {
        return NextResponse.json({ error: "Image not found" });
    }

    // const url = await signCDNUrl(image.createdById, image.folderId, image.id);
    // console.log("CDN Signed URL", url);
    // Download file from google cloud storage
    const file = GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`);
    console.log("Got google file");
    const [buffer] = await file.download();
    const res = new NextResponse(buffer);
    console.log("Got buffer");
    res.headers.set("Content-Type", "image/" + image.extension);
    res.headers.set("Content-Disposition", `inline`);
    res.headers.set("Content-Length", buffer.length.toString());

    return res;
}
