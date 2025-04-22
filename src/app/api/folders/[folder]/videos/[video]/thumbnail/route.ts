import { GoogleBucket } from "@/lib/bucket";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { folder: string, video: string } }) {
    const { user } = await getCurrentSession();

    if (!user) {
        return Response.json({ error: "You need to be authenticated or have a magic link to access this resource" }, { status: 400 })
    }

    const video = await prisma.file.findUnique({
        where: {
            id: params.video,
            folderId: params.folder,
            createdBy: {
                id: user.id as string
            }
        }
    });

    if (!video) {
        console.log("No video found")
        return Response.json({ error: "No videos found in this folder" }, { status: 404 });
    }

    console.log("Video found", video)
    const file = GoogleBucket.file(`${video.createdById}/${video.folderId}/${video.thumbnail}`);
    const [buffer] = await file.download();
    const res = new NextResponse(buffer);
    return res;
}