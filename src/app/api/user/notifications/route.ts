import { NotificationService } from "@/data/notification-service";
import { getCurrentSession } from "@/data/session";
import { NextResponse } from "next/server";

export async function GET() {
	const { user } = await getCurrentSession();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const notifications = await NotificationService.getMultiple({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json(notifications);
}
