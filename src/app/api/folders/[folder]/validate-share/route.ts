import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const shareToken = req.nextUrl.searchParams.get("share");

    if (!shareToken) {
        return Response.json({ error: "Missing share token param" }, { status: 400 })
    }

    const accessToken = await prisma.accessToken.findUnique({
        where: {
            token: shareToken
        },
    });

    if (!accessToken) {
        return Response.json({ result: "invalid-token" })
    }

    if (accessToken.isActive) {
        return Response.json({ result: "valid-token", permission: accessToken.permission })
    }

    return Response.json({ result: "invalid-token" });
}