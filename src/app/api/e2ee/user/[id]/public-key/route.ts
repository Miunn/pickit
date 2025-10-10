import { UserService } from "@/data/user-service";
import { getCurrentSession } from "@/lib/session";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getCurrentSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const p = await params;

    const user = await UserService.get({
        where: { id: p.id },
        select: { publicKey: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ publicKey: user.publicKey });
}
