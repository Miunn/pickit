import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { GoogleBucket } from "@/lib/bucket";

export async function GET(req: NextRequest, { params }: { params: {folder: string, image: string} }) {
    const { user } = await getCurrentSession();

    if (!user) {
        return Response.json({ error: "You need to be authenticated or have a magic link to access this resource" }, { status: 400 })
    }

    const image = await prisma.image.findUnique({
        where: {
            id: params.image,
            folderId: params.folder,
            createdBy: {
                id: user.id as string
            }
        }
    });

    if (!image) {
        return Response.json({ error: "No images found in this folder" }, { status: 404 });
    }


    const file = GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`);
    const [buffer] = await file.download();
    const res = new NextResponse(buffer);
    res.headers.set('Content-Type', 'image/' + image.extension);
    res.headers.set('Content-Disposition', `attachment; filename=${image.name}.${image.extension}`);
    return res;
}
