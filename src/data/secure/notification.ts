import { Notification } from "@prisma/client";
import { AuthService } from "./auth";

export async function enforceNotification(notification?: Notification | null): Promise<boolean> {
	if (!notification) return false;

	const { session } = await AuthService.isAuthenticated();

	if (!session?.user) {
		return false;
	}

	if (notification.userId === session.user.id) {
		return true;
	}

	return false;
}
