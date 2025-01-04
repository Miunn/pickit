import {NextRequest, NextResponse} from "next/server";
import {auth} from "@/actions/auth";
import {prisma} from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import fs from "fs";

export async function GET(req: NextRequest, { params }: { params: {image: string}, }): Promise<NextResponse> {
    console.log("REQUEST IMAGE", req.nextUrl);
    const shareToken = req.nextUrl.searchParams.get("share");
    const accessKey = req.nextUrl.searchParams.get("h");
    console.log("TRY TO GET IMAGE WITH ACCESS KEY", accessKey);
    if (!shareToken) {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({error: "You must be logged in to load image"});
        }

        const image = await prisma.image.findUnique({
            where: {
                id: params.image,
                createdBy: {
                    id: session.user.id as string
                }
            }
        });

        if (!image) {
            return NextResponse.json({error: "Image not found"});
        }

        const buffer = await fs.promises.readFile(image.path);
        const res = new NextResponse(buffer);
        res.headers.set('Content-Disposition', 'inline');
        res.headers.set('Content-Type', `image/${image.extension}`);
        console.log("SENDING IMAGE", image);
        return res;
    } else {
        const access = await prisma.accessToken.findUnique({
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

        if (!access) {
            return NextResponse.json({error: "Invalid share token"});
        }

        console.log("Got a matching access token", access);
        if (access.locked && access.pinCode) {
            console.log("Access locked with pin code", access.pinCode);
            if (!accessKey) {
                return NextResponse.json({error: "Invalid access key"});
            }

            const match = bcrypt.compareSync(access.pinCode as string, accessKey);

            if (!match) {
                return NextResponse.json({error: "Invalid access key"});
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
            return NextResponse.json({error: "Image not found"});
        }

        const buffer = await fs.promises.readFile(image.path);
        const res = new NextResponse(buffer);
        res.headers.set('Content-Disposition', 'inline');
        res.headers.set('Content-Type', `image/${image.extension}`);
        console.log("SENDING IMAGE WITH ACCESS KEY", image);
        return res;
    }
}
