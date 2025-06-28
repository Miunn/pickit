import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import { GoogleBucket } from "@/lib/bucket";
import { isAllowedToAccessFile } from "@/lib/dal";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{folder: string, image: string}> }
) {
    const params = await props.params;
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");
    const tokenType = req.nextUrl.searchParams.get("t");

    if (!isAllowedToAccessFile(params.image, shareToken, accessKey, tokenType)) {
        return Response.json({ error: "You need to be authenticated or have a magic link to access this resource" }, { status: 400 })
    }

    const image = await prisma.file.findUnique({
        where: {
            id: params.image,
            folderId: params.folder
        }
    });

    if (!image) {
        return Response.json({ error: "No images found in this folder" }, { status: 404 });
    }

    console.log("Starting fetching google");
    const file = GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`);
    console.log("Got google file");
    const [buffer] = await file.download();
    const res = new NextResponse(buffer);
    console.log("Got buffer");
    res.headers.set('Content-Type', 'image/' + image.extension);
    res.headers.set('Content-Disposition', `attachment; filename=${image.name}.${image.extension}`);
    res.headers.set('Content-Length', buffer.length.toString());
    console.log("Returning response");
    return res;
}
