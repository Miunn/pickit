import { FolderWithAccessToken } from "@/lib/definitions";
import { getCurrentSession, SessionValidationResult } from "@/lib/session";
import { FolderTokenPermission } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AccessTokenService } from "@/data/access-token-service";

export enum FolderPermission {
	READ = "read",
	READ_MAP = "read_map",
	WRITE = "write",
	DELETE = "delete",
}

export async function enforceFolder(
	folder: FolderWithAccessToken,
	token?: string,
	hash?: string,
	permission: FolderPermission = FolderPermission.READ
): Promise<{ allowed: true; session: SessionValidationResult } | { allowed: false; reason?: string }> {
	const user = await getCurrentSession();

	if (user.user && folder.createdById === user.user.id) {
		return { allowed: true, session: user };
	}

	if (!token) {
		return { allowed: false };
	}

	const matchingToken = folder.accessTokens.find(t => t.token === token);

	if (!matchingToken || !matchingToken.isActive) {
		return { allowed: false };
	}

	if (matchingToken.locked) {
		const tokenPin = await AccessTokenService.get({
			where: { id: matchingToken.id },
			method: "unique",
			select: { pinCode: true },
		});

		if (!hash || !tokenPin?.pinCode) {
			return { allowed: false, reason: "invalid-pin" };
		}

		const matchHash = await bcrypt.compare(tokenPin.pinCode, hash);

		if (!matchHash) {
			return { allowed: false, reason: "invalid-pin" };
		}
	}

	if (permission === FolderPermission.READ_MAP && matchingToken.allowMap) {
		return { allowed: true, session: user };
	} else if (permission === FolderPermission.READ_MAP && !matchingToken.allowMap) {
		return { allowed: false };
	}

	if (permission === FolderPermission.WRITE && matchingToken.permission === FolderTokenPermission.WRITE) {
		return { allowed: true, session: user };
	} else if (permission === FolderPermission.WRITE && matchingToken.permission !== FolderTokenPermission.WRITE) {
		return { allowed: false };
	}

	if (permission === FolderPermission.READ) {
		return { allowed: true, session: user };
	}

	return { allowed: false };
}
