import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import { isAllowedToAccessFile } from "@/lib/dal";
import { GoogleBucket } from "@/lib/bucket";

export async function GET(req: NextRequest, { params }: { params: {folder: string, video: string} }) {
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");
    const tokenType = req.nextUrl.searchParams.get("t");

    if (!isAllowedToAccessFile(params.video, shareToken, accessKey, tokenType)) {
        return Response.json({ error: "You need to be authenticated or have a magic link to access this resource" }, { status: 400 })
    }

    const video = await prisma.file.findUnique({
        where: {
            id: params.video,
            folderId: params.folder
        }
    });

    if (!video) {
        return Response.json({ error: "No videos found in this folder" }, { status: 404 });
    }


    const file = GoogleBucket.file(`${video.createdById}/${video.folderId}/${video.id}`);
    const [buffer] = await file.download();
    const res = new NextResponse(buffer);
    res.headers.set('Content-Type', 'video/' + video.extension);
    res.headers.set('Content-Disposition', `attachment; filename=${video.name}.${video.extension}`);
    return res;
}
