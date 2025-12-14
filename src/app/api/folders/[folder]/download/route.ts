import { NextRequest, NextResponse } from "next/server";
import { isAllowedToAccessFile } from "@/lib/dal";
import { GoogleBucket } from "@/lib/bucket";
import archiver from "archiver";
import { PassThrough } from "node:stream";
import { FolderService } from "@/data/folder-service";

export async function GET(req: NextRequest, props: { params: Promise<{ folder: string }> }) {
    const params = await props.params;
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");

    if (!isAllowedToAccessFile(params.folder, shareToken, accessKey)) {
        return Response.json(
            { error: "You need to be authenticated or have a magic link to access this resource" },
            { status: 400 }
        );
    }

    const folder = await FolderService.get({
        where: { id: params.folder },
        include: { files: true },
    });

    if (!folder) {
        return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder.files.length === 0) {
        return Response.json({ error: "No files found in this folder" }, { status: 404 });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", err => {
        console.error(err);
        throw err;
    });

    const stream = new PassThrough();
    archive.pipe(stream);

    for (const file of folder.files) {
        const path = `${folder.createdById}/${folder.id}/${file.id}`;
        const stream = GoogleBucket.file(path).createReadStream();

        archive.append(stream, { name: `${file.name}.${file.extension}` });
    }

    archive.finalize();

    const webStream = new ReadableStream({
        start(controller) {
            stream.on("data", chunk => controller.enqueue(chunk));
            stream.on("end", () => controller.close());
            stream.on("error", err => controller.error(err));
        },
    });

    return new NextResponse(webStream, {
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename=${folder.name}.zip`,
        },
    });
}
