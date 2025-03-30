import { GoogleBucket } from "@/lib/bucket";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export default async function GET(req: NextRequest, { params }: { params: { folder: string, video: string } }) {
    const { user } = await getCurrentSession();

    if (!user) {
        return Response.json({ error: "You need to be authenticated or have a magic link to access this resource" }, { status: 400 })
    }

    const video = await prisma.video.findUnique({
        where: {
            id: params.video,
            folderId: params.folder,
            createdBy: {
                id: user.id as string
            }
        }
    });

    if (!video) {
        return Response.json({ error: "No videos found in this folder" }, { status: 404 });
    }

    const file = GoogleBucket.file(`${video.createdById}/${video.folderId}/${video.id}`);
    const [buffer] = await file.download();
    const res = new NextResponse(buffer);
    res.headers.set('Content-Type', 'image/png');
    res.headers.set('Content-Disposition', `attachment; filename=${video.name}.png`);
    return res;
}