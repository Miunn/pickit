import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleBucket } from "@/lib/bucket";
import { isAllowedToAccessFile } from "@/lib/dal";
export async function GET(req: NextRequest, { params }: { params: { image: string }, }): Promise<NextResponse> {
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");
    const tokenType = req.nextUrl.searchParams.get("t");
    
    if (!isAllowedToAccessFile(params.image, shareToken, accessKey, tokenType)) {
        return NextResponse.json({ error: "You need to be authenticated or have a magic link to access this resource" }, { status: 400 })
    }

    const image = await prisma.file.findUnique({
        where: { id: params.image }
    });

    if (!image) {
        return NextResponse.json({ error: "Image not found" });
    }

    const file = GoogleBucket.file(`${image.createdById}/${image.folderId}/${image.id}`);
    const [buffer] = await file.download();
    const res = new NextResponse(buffer);
    res.headers.set('Content-Disposition', 'inline');
    res.headers.set('Content-Type', `image/${image.extension}`);
    return res;
}
