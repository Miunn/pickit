import { AccessTokenService } from "@/data/access-token-service";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) return;

    const accessToken = await AccessTokenService.get({
        where: {
            token: token,
        },
    });

    if (accessToken) {
        await AccessTokenService.update(token, {
            uses: {
                increment: 1,
            },
        });
        revalidatePath("/app/links");
        return NextResponse.json({ message: "Token was successfullly incremented" }, { status: 200 });
    }

    return NextResponse.json({ message: "Token not found" }, { status: 404 });
}
