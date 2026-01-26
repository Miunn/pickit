"use server";

import { UserService } from "@/data/user-service";
import { getCurrentSession, invalidateAllSessions } from "@/data/session";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function deleteUser(userId: string) {
	const { user } = await getCurrentSession();

	if (!user?.role.includes(Role.ADMIN)) {
		return { error: "unauthorized" };
	}

	await UserService.delete(userId);

	invalidateAllSessions(userId);

	revalidatePath("/app/administration");
	return { error: null };
}
