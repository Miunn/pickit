import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getCurrentSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const tags = await prisma.folderTag.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return NextResponse.json(tags)
}