import { FolderWithAccessToken } from "@/lib/definitions";
import { getCurrentSession } from "@/data/session";
import { File, FolderTokenPermission, Session } from "@prisma/client";
import bcrypt from "bcryptjs";

export enum FilePermission {
	READ = "read",
	UPDATE = "write",
	DELETE = "delete",
}

export async function enforceFile(
	file: File & { folder: FolderWithAccessToken },
	permission: FilePermission = FilePermission.READ,
	token?: string,
	key?: string
): Promise<{ isAllowed: true; session?: Session | null } | { isAllowed: false }> {
	const { session } = await getCurrentSession();

	if (session?.userId === file.createdById) {
		return { isAllowed: true, session };
	}

	if (!token) {
		return { isAllowed: false };
	}

	const matchingToken = file.folder.accessTokens.find(t => t.token === token);

	if (!matchingToken?.isActive) {
		return { isAllowed: false };
	}

	if (matchingToken.pinCode && !key) {
		return { isAllowed: false };
	} else if (matchingToken.pinCode && key) {
		const matchHash = await bcrypt.compare(matchingToken.pinCode, key);

		if (!matchHash) {
			return { isAllowed: false };
		}
	}

	if (permission === FilePermission.READ) {
		return { isAllowed: true, session };
	}

	if (matchingToken.permission === FolderTokenPermission.WRITE) {
		return { isAllowed: true, session };
	}

	return { isAllowed: false };
}
