import { FolderWithAccessToken } from "@/lib/definitions";
import { File, FolderTokenPermission } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthService } from "./auth";

export enum FilePermission {
	READ = "read",
	UPDATE = "write",
	DELETE = "delete",
}

export async function enforceFile(
	file?: (File & { folder: FolderWithAccessToken }) | null,
	permission: FilePermission = FilePermission.READ,
	token?: string,
	key?: string
): Promise<boolean> {
	if (!file) return false;
	const { isAuthenticated, session } = await AuthService.isAuthenticated();

	if (isAuthenticated && session.user.id === file.createdById) {
		return true;
	}

	if (!token) {
		return false;
	}

	const matchingToken = file.folder.accessTokens.find(t => t.token === token);

	if (!matchingToken?.isActive) {
		return false;
	}

	if (matchingToken.pinCode && !key) {
		return false;
	} else if (matchingToken.pinCode && key) {
		const matchHash = await bcrypt.compare(matchingToken.pinCode, key);

		if (!matchHash) {
			return false;
		}
	}

	if (permission === FilePermission.READ) {
		return true;
	}

	if (matchingToken.permission === FolderTokenPermission.WRITE) {
		return true;
	}

	return false;
}
