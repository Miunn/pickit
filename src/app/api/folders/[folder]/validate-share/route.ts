import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { permission } from "process";

export async function GET(req: NextRequest, { params }: { params: {folder: string} }) {
    const shareToken = req.nextUrl.searchParams.get("share");

    if (!shareToken) {
        return Response.json({ error: "Missing share token param" }, { status: 400 })
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: params.folder
        },
        include: {
            AccessToken: true
        }
    });

    console.log(`Folder ${folder?.name} tokens:`, folder?.AccessToken);

    if (!folder?.AccessToken) {
        return Response.json({ result: "invalid-token" })
    }

    for (const token of folder.AccessToken) {
        if (token.token === shareToken) {
            return Response.json({ result: "valid-token", permission: token.permission })
        }
    }

    return Response.json({ result: "invalid-token" });
}