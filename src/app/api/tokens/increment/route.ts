import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) return;

    const accessToken = await prisma.accessToken.findUnique({   
        where: {
            token: token
        }
    });

    if (accessToken) {
        await prisma.accessToken.update({
            where: {
                token: token
            },
            data: {
                uses: {
                    increment: 1
                }
            }
        })
        revalidatePath("/dashboard/links");
        return NextResponse.json({
            message: "Token was successfullly incremented"
        }, {
            status: 200
        });
    }

    const personAccessToken = await prisma.personAccessToken.findUnique({
        where: {
            token: token
        }
    });

    if (personAccessToken) {
        await prisma.personAccessToken.update({
            where: {
                token: token
            },
            data: {
                uses: {
                    increment: 1
                }
            }
        })
        revalidatePath("/dashboard/links");
        return NextResponse.json({
            message: "Token was successfullly incremented"
        }, {
            status: 200
        });
    }

    return NextResponse.json({
        message: "Token not found"
    }, {
        status: 404
    });
}