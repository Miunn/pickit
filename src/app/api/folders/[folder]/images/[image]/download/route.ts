import { NextRequest, NextResponse } from "next/server";
import { GoogleBucket } from "@/lib/bucket";
import { isAllowedToAccessFile } from "@/lib/dal";
import { FileService } from "@/data/file-service";

export async function GET(req: NextRequest, props: { params: Promise<{ folder: string; image: string }> }) {
    const params = await props.params;
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");

    if (!isAllowedToAccessFile(params.image, shareToken, accessKey)) {
        return Response.json(
            { error: "You need to be authenticated or have a magic link to access this resource" },
            { status: 400 }
        );
    }

    const image = await FileService.get({
        where: {
            id: params.image,
            folderId: params.folder,
        },
    });

    if (!image) {
        return Response.json({ error: "Image not found" }, { status: 404 });
    }

    const file = GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`);

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
            "Content-Type": "image/" + image.extension,
            "Content-Disposition": `attachment; filename=${encodeURIComponent(image.name)}.${encodeURIComponent(image.extension)}`,
        },
    });
    return res;
}
