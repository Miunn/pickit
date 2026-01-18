import { FolderTokenPermission } from "@prisma/client";
import { prisma } from "./prisma";
import { getCurrentSession } from "./session";
import * as bcrypt from "bcryptjs";
import { stripe } from "./stripe";

export async function hasFolderOwnerAccess(folderId: string): Promise<boolean> {
	const { user } = await getCurrentSession();

	if (user) {
		const folder = await prisma.folder.findUnique({
			where: { id: folderId, createdBy: { id: user.id } },
		});

		if (folder) {
			return true;
		}
	}

	return false;
}

/**
 * Returns 1 for access granted
 * 2 if a code is needed
 * 3 if the code is wrong
 * 0 if unauthorized
 * @param folderId
 * @param shareToken
 * @param accessKey
 * @param tokenType
 * @returns
 */
export async function isAllowedToAccessFolder(
	folderId: string,
	shareToken?: string | null,
	accessKey?: string | null
	// tokenType?: string | null
): Promise<number> {
	const { user } = await getCurrentSession();

	if (user) {
		const folder = await prisma.folder.findUnique({
			where: { id: folderId, createdBy: { id: user.id } },
		});

		if (folder) {
			return 1;
		}
	}

	if (shareToken) {
		const access = await prisma.accessToken.findUnique({
			where: { token: shareToken },
			include: {
				folder: { select: { id: true } },
			},
			omit: { pinCode: false },
		});

		if (!access) {
			return 0;
		}

		if (access.locked && access.pinCode) {
			if (!accessKey) {
				return 2;
			}

			const match = bcrypt.compareSync(access.pinCode as string, accessKey || "");

			if (!match) {
				return 3;
			}
		}

		return 1;
	}

	return 0;
}

export async function isAllowedToAccessFile(
	fileId: string,
	shareToken?: string | null,
	accessKey?: string | null
): Promise<boolean> {
	const { user } = await getCurrentSession();

	if (user) {
		const file = await prisma.file.findUnique({
			where: {
				id: fileId,
				createdBy: { id: user.id },
			},
		});

		if (file) {
			return true;
		}
	}

	if (shareToken) {
		const access = await prisma.accessToken.findUnique({
			where: {
				token: shareToken,
			},
			include: {
				folder: {
					select: {
						id: true,
					},
				},
			},
			omit: {
				pinCode: false,
			},
		});

		if (!access) {
			return false;
		}

		if (access.locked && access.pinCode) {
			if (!accessKey) {
				return false;
			}

			const match = bcrypt.compareSync(access.pinCode as string, accessKey || "");

			if (!match) {
				return false;
			}
		}

		return true;
	}

	return false;
}

export async function isAllowedToDeleteComment(
	commentId: string,
	shareToken?: string | null,
	accessKey?: string | null
) {
	const comment = await prisma.comment.findUnique({
		where: { id: commentId },
		include: { file: { select: { id: true } } },
	});

	if (!comment) {
		return false;
	}

	if (comment.createdById) {
		const { user } = await getCurrentSession();

		if (!user) {
			return false;
		}

		return comment.createdById === user.id;
	}

	if (comment.createdByEmail) {
		const isAllowed = await isAllowedToAccessFile(comment.fileId, shareToken, accessKey);
		if (!shareToken || !isAllowed) {
			return false;
		}

		const token = await prisma.accessToken.findUnique({
			where: { token: shareToken },
		});

		if (!token?.email) {
			return false;
		}

		return token.email === comment.createdByEmail;
	}

	return false;
}

export async function canLikeFile(fileId: string, shareToken?: string | null, accessKey?: string | null) {
	// Only email-shared people and owners can like files
	if (!shareToken) {
		return false;
	}

	const token = await prisma.accessToken.findUnique({
		where: { token: shareToken },
	});

	if (!token?.email) {
		return false;
	}

	return await isAllowedToAccessFile(fileId, shareToken, accessKey);
}

export async function canLikeComment(commentId: string, shareToken?: string | null, accessKey?: string | null) {
	const comment = await prisma.comment.findUnique({
		where: { id: commentId },
		include: { file: { select: { id: true, folderId: true } } },
	});

	if (!comment) {
		return false;
	}

	const { user } = await getCurrentSession();

	if (user) {
		return isAllowedToAccessFile(comment.fileId);
	}

	if (!shareToken) {
		return false;
	}

	const token = await prisma.accessToken.findUnique({
		where: { token: shareToken },
	});

	if (!token?.email) {
		return false;
	}

	return isAllowedToAccessFile(comment.fileId, shareToken, accessKey);
}

export async function canAccessMap(shareToken?: string | null, accessKey?: string | null) {
	const { user } = await getCurrentSession();

	// Priority is set to access token if user is logged in
	if (user && !shareToken) {
		return true;
	}

	if (!shareToken) {
		return false;
	}

	const isAllowed = await isAccessWithTokenValid(shareToken, accessKey);
	if (!isAllowed) {
		return false;
	}

	const token = await prisma.accessToken.findUnique({
		where: { token: shareToken },
	});

	if (token?.allowMap) {
		return true;
	}

	return false;
}

export async function isAccessWithTokenValid(
	shareToken?: string | null,
	key?: string | null,
	matchPermission?: FolderTokenPermission
) {
	if (!shareToken) {
		return false;
	}

	const token = await prisma.accessToken.findUnique({
		where: { token: shareToken },
		omit: { pinCode: false },
	});

	if (!token) {
		return false;
	}

	if (matchPermission && token.permission !== matchPermission) {
		return false;
	}

	if (token.locked && token.pinCode) {
		if (!key) {
			return false;
		}

		return bcrypt.compareSync(token.pinCode, key);
	}

	if (token.expires) {
		return token.expires > new Date();
	}

	return true;
}

export async function hasActiveSubscription(): Promise<boolean> {
	const { user } = await getCurrentSession();

	if (!user) {
		return false;
	}

	if (!user.stripeSubscriptionId) {
		return false;
	}

	const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

	return subscription.status === "active" || subscription.status === "trialing";
}
