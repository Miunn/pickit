"use server";

import { NotificationService } from "@/data/notification-service";
import { getCurrentSession } from "@/data/session";

export async function markAllNotificationsAsRead() {
	const { user } = await getCurrentSession();

	if (!user) {
		return { error: "Unauthorized" };
	}

	await NotificationService.updateMany({ userId: user.id, isRead: false }, { isRead: true });

	return { success: true };
}

export async function markNotificationAsRead(notificationId: string) {
	const { user } = await getCurrentSession();

	if (!user) {
		return { error: "Unauthorized" };
	}

	await NotificationService.update(notificationId, { isRead: true });

	return { success: true };
}
