import { FolderWithAccessToken } from "@/lib/definitions";
import { Comment, File, FolderTokenPermission } from "@prisma/client";
import { AuthService } from "./auth";
import bcrypt from "bcryptjs";

export enum CommentPermission {
	READ = "read",
	UPDATE = "write",
	DELETE = "delete",
}

export async function enforceComment(
	comment?: (Comment & { file: File & { folder: FolderWithAccessToken } }) | null,
	permission: CommentPermission = CommentPermission.READ,
	token?: string,
	key?: string
): Promise<boolean> {
	if (!comment) return false;

	const { isAuthenticated, session } = await AuthService.isAuthenticated();

	if (isAuthenticated && session.user.id === comment.createdById) {
		return true;
	}

	if (!token) {
		return false;
	}

	const matchingToken = comment.file.folder.accessTokens.find(t => t.token === token);

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

	if (permission === CommentPermission.READ) {
		return true;
	}

	if (matchingToken.permission === FolderTokenPermission.WRITE) {
		return true;
	}

	return false;
}
