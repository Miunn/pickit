import { enforceFolder } from "@/data/secure/folder";
import { enforceFile } from "@/data/secure/file";
import { enforceNotification } from "./notification";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { enforceComment } from "./comment";
import { AccessTokenService } from "../access-token-service";
import bcrypt from "bcryptjs";
import { enforceMapAccess } from "./map";

async function getCurrentSession() {
	return await auth.api.getSession({
		headers: await headers(),
	});
}

async function validateToken(token: string, hash?: string): Promise<boolean> {
	const accessToken = await AccessTokenService.get({
		where: { token },
		select: { pinCode: true, isActive: true },
	});

	if (!accessToken?.isActive) {
		return false;
	}

	if (accessToken.pinCode) {
		if (!hash) {
			return false;
		}

		const match = await bcrypt.compare(accessToken.pinCode, hash);

		if (!match) {
			return false;
		}

		return true;
	}

	return true;
}

export const SecureService = {
	getSession: getCurrentSession,
	validateToken: validateToken,
	folder: { enforce: enforceFolder },
	file: { enforce: enforceFile },
	notification: { enforce: enforceNotification },
	comment: { enforce: enforceComment },
	map: { enforce: enforceMapAccess },
};
