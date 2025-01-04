import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const shareToken = req.nextUrl.searchParams.get("share");

    if (!shareToken) {
        return Response.json({ error: "missing-share-param" }, { status: 400 })
    }

    const accessToken = await prisma.accessToken.findUnique({
        where: {
            token: shareToken
        },
    });

    if (!accessToken) {
        console.log("Invalid token")
        return Response.json({ result: "invalid-token" })
    }

    if (!accessToken.isActive) {
        console.log("Token is not active")
        return Response.json({ result: "invalid-token" });
    }

    console.log("Token is valid")
    return Response.json({ result: "valid-token", permission: accessToken.permission })
}