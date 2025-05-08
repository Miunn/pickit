"use server"

import { getCurrentSession, invalidateAllSessions } from "@/lib/session";
import { UserAdministration } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function deleteUser(userId: string) {
    const { user } = await getCurrentSession();

    if (!user || !user.role.includes(Role.ADMIN)) {
        return { error: "unauthorized" };
    }

    await prisma.user.delete({
        where: { id: userId },
    })

    invalidateAllSessions(userId);

    revalidatePath("/app/administration")
    return { error: null };
}