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

    const personAccessToken = await prisma.personAccessToken.findUnique({
        where: {
            token: shareToken
        }
    })

    console.log("Access token:", accessToken);
    console.log("Person access token:", personAccessToken);

    if (!accessToken && !personAccessToken) {
        return Response.json({ result: "invalid-token" })
    }

    if ((accessToken && !accessToken.isActive) || (personAccessToken && !personAccessToken.isActive)) {
        return Response.json({ result: "invalid-token" });
    }

    return Response.json({ result: "valid-token", permission: accessToken?.permission || personAccessToken?.permission })
}