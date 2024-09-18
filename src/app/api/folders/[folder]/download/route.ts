import {NextRequest, NextResponse} from "next/server";
import {auth} from "@/actions/auth";
import {prisma} from "@/lib/prisma";
import JSZip from "jszip";
import fs from "fs";

export async function GET(req: NextRequest, { params }: { params: {folder: string} }) {
    console.log("CALL DOWNLOAD FOLDER");
    console.log("Request", req);

    const session = await auth();

    if (!session?.user) {
        return {error: "You must be logged in to download a folders"};
    }

    console.log("Downloading folders", params.folder);

    const images = await prisma.image.findMany({
        where: {
            folderId: params.folder,
            createdBy: {
                id: session.user.id as string
            }
        }
    });

    const zip = new JSZip();

    for (const image of images) {
        const file = fs.readFileSync(process.cwd() + "/" + image.path);
        const nameFromPath = image.path.split("/").pop() as string;
        zip.file(nameFromPath, file);
    }

    const zipData = await zip.generateAsync({type: "blob"});

    const res = new NextResponse(zipData.stream());
    res.headers.set('Content-Type', 'application/zip');
    res.headers.set('Content-Disposition', `attachment; filename=${params.folder}.zip`);
    return res;
}
