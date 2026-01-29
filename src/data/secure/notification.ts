import { Notification } from "@prisma/client";
import { getCurrentSession, SessionValidationResult } from "../session";

export async function enforceNotification(
	notification?: Notification | null
): Promise<{ allowed: true; session: SessionValidationResult } | { allowed: false }> {
	if (!notification) return { allowed: false };

	const session = await getCurrentSession();

	if (!session?.user) {
		return { allowed: false };
	}

	if (notification.userId === session.user.id) {
		return { allowed: true, session };
	}

	return { allowed: false };
}
