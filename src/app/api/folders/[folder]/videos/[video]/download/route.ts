import { NextRequest, NextResponse } from "next/server";
import { isAllowedToAccessFile } from "@/lib/dal";
import { GoogleBucket } from "@/lib/bucket";
import { FileService } from "@/data/file-service";

export async function GET(req: NextRequest, props: { params: Promise<{ folder: string; video: string }> }) {
    const params = await props.params;
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");

    if (!isAllowedToAccessFile(params.video, shareToken, accessKey)) {
        return Response.json(
            { error: "You need to be authenticated or have a magic link to access this resource" },
            { status: 400 }
        );
    }

    const video = await FileService.get({
        where: {
            id: params.video,
            folderId: params.folder,
        },
    });

    if (!video) {
        return Response.json({ error: "No videos found in this folder" }, { status: 404 });
    }

    const file = GoogleBucket.file(`${video.createdById}/${video.folderId}/${video.id}`);

    const stream = file.createReadStream();

    // Convert Node.js Readable (from Google Cloud Storage) to a Web ReadableStream
    // suitable for the Fetch API / NextResponse
    const webStream = new globalThis.ReadableStream({
        start(controller) {
            stream.on("data", chunk => controller.enqueue(chunk));
            stream.on("end", () => controller.close());
            stream.on("error", err => controller.error(err));
        },
        cancel() {
            stream.destroy();
        },
    });
    const res = new NextResponse(webStream, {
        headers: {
            "Content-Type": "video/" + video.extension,
            "Content-Disposition": `attachment; filename=${video.name}.${video.extension}`,
        },
    });

    return res;
}
