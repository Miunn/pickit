import {NextRequest, NextResponse} from "next/server";
import {auth} from "@/actions/auth";
import {prisma} from "@/lib/prisma";
import fs from "fs";

export async function GET(req: NextRequest, { params }: { params: {image: string} }): Promise<NextResponse> {
    const accessKey = req.nextUrl.searchParams.get("accessKey");
    if (!accessKey) {
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
        res.headers.set('Content-Type', 'image/*');
        return res;
    } else {
        const access = await prisma.accessToken.findUnique({
            where: {
                token: accessKey
            },
            include: {
                folder: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!access) {
            return NextResponse.json({error: "Invalid access key"});
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
        res.headers.set('Content-Type', 'image/*');
        return res;
    }
}
