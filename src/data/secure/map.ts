import { Session } from "@/lib/auth";
import { AuthService } from "./auth";
import { SecureService } from "./secure-service";

export async function enforceMapAccess(
	shareToken: string | undefined,
	hash: string | undefined
): Promise<
	| { isAllowed: true; session?: Session }
	| { isAllowed: false; reason: "not-authenticated" | "invalid-token"; session?: undefined }
> {
	const { isAuthenticated, session } = await AuthService.isAuthenticated();

	if (isAuthenticated) {
		return { isAllowed: true, session };
	}

	if (!shareToken) {
		return { isAllowed: false, reason: "not-authenticated" };
	}

	const isValidToken = await SecureService.validateToken(shareToken, hash);

	if (!isValidToken) {
		return { isAllowed: false, reason: "invalid-token" };
	}

	return { isAllowed: true };
}
