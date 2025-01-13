import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const shareToken = req.nextUrl.searchParams.get("share");
    const shareType = req.nextUrl.searchParams.get("t");

    if (!shareToken) {
        return Response.json({ error: "missing-share-param" }, { status: 400 })
    }

    let accessToken;

    if (shareType === "p") {
        accessToken = await prisma.personAccessToken.findUnique({
            where: {
                token: shareToken
            },
        });
    } else {
        accessToken = await prisma.accessToken.findUnique({
            where: {
                token: shareToken
            },
        });
    }

    if (!accessToken) {
        return Response.json({ result: "invalid-token" })
    }

    if (!accessToken.isActive) {
        return Response.json({ result: "invalid-token" });
    }

    return Response.json({ result: "valid-token", permission: accessToken.permission })
}