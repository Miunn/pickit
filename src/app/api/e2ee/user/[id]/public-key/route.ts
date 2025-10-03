import { UserService } from "@/data/user-service";
import { getCurrentSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(props: { params: Promise<{ id: string }> }) {
    const session = await getCurrentSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;

    const user = await UserService.get({
        where: { id: params.id },
        select: { publicKey: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ publicKey: user.publicKey });
}
