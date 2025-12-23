import { NextRequest, NextResponse } from "next/server";
import { isAllowedToAccessFile } from "@/lib/dal";
import { GoogleBucket } from "@/lib/bucket";
import { FileService } from "@/data/file-service";

/**
 * Streams a video file from Google Cloud Storage and returns it as an HTTP response.
 *
 * @param req - The incoming Next.js request; query may include `share` (magic link token) and `h` (access key).
 * @param props - An object whose `params` promise resolves to route parameters `{ folder, video }` identifying the requested file.
 * @returns A NextResponse whose body is the video's readable stream and which includes `Content-Type`, `Content-Length`, and `Content-Disposition` headers. If access is denied, returns a JSON error with status 400. If the video is not found, returns a JSON error with status 404.
 */
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
        return Response.json({ error: "Video not found" }, { status: 404 });
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
            "Content-Length": video.size.toString(),
            "Content-Disposition": `attachment; filename=${video.name}.${video.extension}`,
        },
    });

    return res;
}