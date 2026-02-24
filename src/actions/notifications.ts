"use server";

import { NotificationService } from "@/data/notification-service";
import { AuthService } from "@/data/secure/auth";
import { SecureService } from "@/data/secure/secure-service";

export async function markAllNotificationsAsRead() {
	const { session } = await AuthService.isAuthenticated();

	if (!session?.user) {
		return { error: "Unauthorized" };
	}

	await NotificationService.updateMany({ userId: session.user.id, isRead: false }, { isRead: true });
	return { success: true };
}

export async function markNotificationAsRead(notificationId: string) {
	const notification = await NotificationService.get({
		where: { id: notificationId },
	});

	const isAllowed = await SecureService.notification.enforce(notification);

	if (!isAllowed) {
		return { error: "Unauthorized" };
	}

	await NotificationService.update(notificationId, { isRead: true });

	return { success: true };
}
