import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import JSZip from "jszip";
import fs from "fs";
import { getCurrentSession } from "@/lib/session";

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


    const file = fs.readFileSync(process.cwd() + "/" + image.path);

    const blob = new Blob([file], { type: "image/" + image.extension });
    const res = new NextResponse(blob.stream());
    res.headers.set('Content-Type', 'image/' + image.extension);
    res.headers.set('Content-Disposition', `attachment; filename=${image.name}.${image.extension}`);
    return res;
}
