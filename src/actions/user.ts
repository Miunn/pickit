"use server";

import { UserService } from "@/data/user-service";
import { AuthService } from "@/data/secure/auth";

export async function setupE2EE(
	privateKey: string,
	publicKey: string,
	iv: string,
	salt: string
): Promise<{ error: string | null }> {
	const { isAuthenticated, session } = await AuthService.isAuthenticated();

	if (!isAuthenticated) {
		return { error: "You must be logged in to setup E2EE" };
	}

	await UserService.update(session.user.id, {
		privateKey,
		publicKey,
		e2eeSalt: salt,
		e2eeSaltIv: iv,
	});

	return { error: null };
}
