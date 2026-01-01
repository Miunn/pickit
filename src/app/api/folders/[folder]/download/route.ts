import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
import archiver from "archiver";
import { PassThrough } from "node:stream";
import { FolderService } from "@/data/folder-service";
import { SecureService } from "@/data/secure/secure-service";

/**
 * Streams a ZIP archive containing all files in the specified folder.
 *
 * @param req - Incoming Next.js request; query parameters `share` (share token) and `h` (access key) are used for access control.
 * @param props - Object with a `params` promise that resolves to `{ folder: string }` where `folder` is the folder id to download.
 * @returns A NextResponse whose body is a streaming ZIP of the folder's files; returns a JSON error response with status 400 if access is denied, or 404 if the folder is not found or contains no files.
 */
export async function GET(req: NextRequest, props: { params: Promise<{ folder: string }> }) {
    const params = await props.params;
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");

    const folder = await FolderService.get({
        where: { id: params.folder },
        include: { files: true, accessTokens: true },
    });

    if (!folder) {
        return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    const isAllowed = await SecureService.folder.enforce(folder, shareToken || undefined, accessKey || undefined);

    if (!isAllowed) {
        return Response.json(
            { error: "You need to be authenticated or have a magic link to access this resource" },
            { status: 400 }
        );
    }

    if (folder.files.length === 0) {
        return Response.json({ error: "No files found in this folder" }, { status: 404 });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();

    archive.on("error", err => {
        console.error(err);
        stream.destroy(err);
    });

    archive.pipe(stream);

    for (const file of folder.files) {
        const path = `${folder.createdById}/${folder.id}/${file.id}`;
        const fileStream = GoogleBucket.file(path).createReadStream();

        archive.append(fileStream, { name: `${file.name}.${file.extension}` });
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
            "Content-Disposition": `attachment; filename=${encodeURIComponent(folder.name)}.zip; filename*=UTF-8''${encodeURIComponent(folder.name)}.zip`,
        },
    });
}
