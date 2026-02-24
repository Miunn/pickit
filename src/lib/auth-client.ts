import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";
import { ac, admin, user } from "@/lib/permissions";

export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: process.env.NEXT_PUBLIC_APP_URL!,
	plugins: [
		adminClient({
			ac,
			roles: {
				admin,
				user,
			},
		}),
		inferAdditionalFields<typeof auth>(),
	],
});

export const { useSession } = authClient;
