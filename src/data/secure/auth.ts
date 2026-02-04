import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";

async function isAuthenticated(): Promise<
	{ isAuthenticated: false; session?: undefined } | { isAuthenticated: true; session: Session }
> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) {
		return { isAuthenticated: false };
	}
	return { isAuthenticated: true, session };
}

export const AuthService = {
	isAuthenticated,
};
