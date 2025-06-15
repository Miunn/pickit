import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const session = await getCurrentSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: { publicKey: true }
    })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ publicKey: user.publicKey });
}