import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import JSZip from "jszip";
import { getCurrentSession } from "@/lib/session";
import { GoogleBucket } from "@/lib/bucket";

export async function GET(req: NextRequest, { params }: { params: {folder: string} }) {
    const { user } = await getCurrentSession();

    if (!user) {
        return Response.json({ error: "You need to be authenticated or have a magic link to access this resource" }, { status: 400 })
    }

    const images = await prisma.file.findMany({
        where: {
            folderId: params.folder,
            createdBy: {
                id: user.id as string
            }
        }
    });

    if (images.length === 0) {
        return Response.json({ error: "No images found in this folder" }, { status: 404 });
    }

    const zip = new JSZip();

    for (const image of images) {
        const file = GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`);
        const [buffer] = await file.download();
        zip.file(`${image.name}-${image.createdAt.getTime()}.${image.extension}`, buffer);
    }

    const zipData = await zip.generateAsync({type: "blob"});

    const res = new NextResponse(zipData.stream());
    res.headers.set('Content-Type', 'application/zip');
    res.headers.set('Content-Disposition', `attachment; filename=${params.folder}.zip`);
    return res;
}
