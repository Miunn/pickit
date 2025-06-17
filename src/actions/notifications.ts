'use server'

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function markAllNotificationsAsRead() {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "Unauthorized" };
    }

    await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true }
    });

    return { success: true };
}

export async function markNotificationAsRead(notificationId: string) {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "Unauthorized" };
    }
    
    await prisma.notification.update({
        where: { id: notificationId, userId: user.id },
        data: { isRead: true }
    });

    return { success: true };
}