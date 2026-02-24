import { NotificationService } from "@/data/notification-service";
import { AuthService } from "@/data/secure/auth";
import { NextResponse } from "next/server";

export async function GET() {
	const { session } = await AuthService.isAuthenticated();

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const notifications = await NotificationService.getMultiple({
		where: { userId: session.user.id },
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json(notifications);
}
