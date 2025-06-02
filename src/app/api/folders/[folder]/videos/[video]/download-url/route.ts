import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import { generateV4DownloadUrl } from "@/lib/bucket";
import { isAllowedToAccessFile } from "@/lib/dal";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{folder: string, video: string}> }
) {
    const params = await props.params;
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

    const signedUrl = await generateV4DownloadUrl(`${video.createdById}/${video.folderId}/${video.id}`);
    return NextResponse.json({ url: signedUrl });
}
