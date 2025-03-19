import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import fs from "fs";
import { getCurrentSession } from "@/lib/session";
import { GoogleBucket } from "@/lib/bucket";

export async function GET(req: NextRequest, { params }: { params: { image: string }, }): Promise<NextResponse> {
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");
    const tokenType = req.nextUrl.searchParams.get("t");
    const { user } = await getCurrentSession();
    if (shareToken && shareToken !== "undefined" && shareToken !== "null") {
        let access;
        if (tokenType === "p") {
            access = await prisma.personAccessToken.findUnique({
                where: {
                    token: shareToken
                },
                include: {
                    folder: {
                        select: {
                            id: true
                        }
                    }
                },
                omit: {
                    pinCode: false
                }
            });
        } else {
            access = await prisma.accessToken.findUnique({
                where: {
                    token: shareToken
                },
                include: {
                    folder: {
                        select: {
                            id: true
                        }
                    }
                },
                omit: {
                    pinCode: false
                }
            });
        }

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

        const image = await prisma.image.findUnique({
            where: {
                id: params.image,
                folder: {
                    id: access.folder.id as string
                }
            }
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
    } else if (user) {
        const image = await prisma.image.findUnique({
            where: {
                id: params.image,
                createdBy: {
                    id: user.id as string
                }
            }
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
    } else {
        return NextResponse.json({ error: "Unauthorized" });
    }
}
