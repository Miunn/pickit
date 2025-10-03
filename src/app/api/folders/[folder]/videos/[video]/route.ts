import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { getCurrentSession } from "@/lib/session";
import { GoogleBucket } from "@/lib/bucket";
import { AccessTokenService } from "@/data/access-token-service";
import { FileService } from "@/data/file-service";

export async function GET(req: NextRequest, props: { params: Promise<{ video: string }> }): Promise<NextResponse> {
    const params = await props.params;
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");
    const { user } = await getCurrentSession();
    if (shareToken && shareToken !== "undefined" && shareToken !== "null") {
        const access = await AccessTokenService.get({
            where: {
                token: shareToken,
            },
            include: {
                pinCode: true,
                folder: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!access) {
            return NextResponse.json({ error: "Invalid share token" });
        }

        if (access.locked && access.pinCode) {
            if (!accessKey) {
                return NextResponse.json({ error: "Invalid access key" });
            }

            const match = bcrypt.compareSync(access.pinCode as string, accessKey || "");

            if (!match) {
                return NextResponse.json({ error: "Invalid access key" });
            }
        }

        const video = await FileService.get({
            where: {
                id: params.video,
                folder: {
                    id: access.folder.id as string,
                },
            },
        });

        if (!video) {
            return NextResponse.json({ error: "Image not found" });
        }

        const file = GoogleBucket.file(`${video.createdById}/${video.folderId}/${video.id}`);
        const [buffer] = await file.download();
        const res = new NextResponse(buffer);
        res.headers.set("Content-Disposition", "inline");
        res.headers.set("Content-Type", `video/${video.extension}`);
        return res;
    } else if (user) {
        const video = await FileService.get({
            where: {
                id: params.video,
                createdBy: {
                    id: user.id as string,
                },
            },
        });

        if (!video) {
            return NextResponse.json({ error: "Video not found" });
        }

        const file = GoogleBucket.file(`${video.createdById}/${video.folderId}/${video.id}`);
        const [buffer] = await file.download();
        const res = new NextResponse(buffer);
        res.headers.set("Content-Disposition", "inline");
        res.headers.set("Content-Type", `video/${video.extension}`);
        return res;
    } else {
        return NextResponse.json({ error: "Unauthorized" });
    }
}
