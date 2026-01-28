"use server";

import { CommentWithCreatedBy, CreateCommentFormSchema, EditCommentFormSchema } from "@/lib/definitions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAllowedToDeleteComment } from "@/data/dal";
import { FileService } from "@/data/file-service";
import { CommentService } from "@/data/comment-service";
import { SecureService } from "@/data/secure/secure-service";
import { FolderPermission } from "@/data/secure/folder";

export async function createComment(
	fileId: string,
	data: z.infer<typeof CreateCommentFormSchema>,
	shareToken?: string | null,
	type?: "accessToken" | "personAccessToken" | null,
	h?: string | null
): Promise<CommentWithCreatedBy | null> {
	const file = await FileService.get({
		where: { id: fileId },
		include: {
			folder: {
				include: {
					files: {
						include: { folder: true, comments: { include: { createdBy: true } } },
					},
					createdBy: true,
					accessTokens: { omit: { pinCode: false } },
					slugs: { orderBy: { createdAt: "desc" }, take: 1 },
				},
			},
		},
	});

	if (!file) {
		return null;
	}

	const folder = file.folder;

	const auth = await SecureService.folder.enforce(
		folder,
		shareToken || undefined,
		h || undefined,
		FolderPermission.READ
	);

	if (!auth.allowed) {
		return null;
	}
	let commentName = "Anonymous";
	let createdByEmail = null;

	const { user } = auth.session;

	if (!user || folder.createdById !== user.id) {
		const accessToken = folder.accessTokens.find(a => a.token === shareToken && a.expires >= new Date());

		if (accessToken?.email) {
			commentName = accessToken.email.split("@")[0];
			createdByEmail = accessToken.email;
		}
	} else {
		commentName = user.name;
		createdByEmail = user.email;
	}

	const parsedData = CreateCommentFormSchema.safeParse(data);

	if (!parsedData.success) {
		return null;
	}

	try {
		const data = {
			text: parsedData.data.content,
			createdBy: user ? { connect: { id: user?.id } } : undefined,
			createdByEmail,
			name: commentName,
			file: { connect: { id: fileId } },
		};

		const comment = await CommentService.create(data, {
			file: { include: { folder: true } },
			createdBy: true,
		});

		if (!comment) {
			console.error("Comment creation failed");
			return null;
		}

		revalidatePath(`/app/folders/${folder.slug}`);
		return comment;
	} catch (e) {
		console.error("Error creating comment", e);
		return null;
	}
}

export async function deleteComment(commentId: string, shareToken?: string | null, accessKey?: string | null) {
	const isAllowed = await isAllowedToDeleteComment(commentId, shareToken, accessKey);

	if (!isAllowed) {
		return false;
	}

	try {
		const comment = await CommentService.delete({
			commentId,
			include: {
				file: {
					select: {
						folder: {
							select: { slugs: { orderBy: { createdAt: "desc" }, take: 1 } },
						},
					},
				},
			},
		});

		if (!comment) {
			return false;
		}

		revalidatePath(`/app/folders/${comment.file.folder.slug}`);
		return true;
	} catch (e) {
		console.log("Error deleting comment", e);
		return false;
	}
}

export async function updateComment(
	commentId: string,
	text: string,
	shareToken?: string | null,
	accessKey?: string | null
): Promise<CommentWithCreatedBy | null> {
	const isAllowed = await isAllowedToDeleteComment(commentId, shareToken, accessKey);

	if (!isAllowed) {
		return null;
	}

	const result = EditCommentFormSchema.safeParse({ content: text });
	if (!result.success) {
		return null;
	}

	try {
		const comment = await CommentService.update(
			commentId,
			{ text: result.data.content },
			{
				file: {
					include: {
						folder: {
							select: {
								id: true,
								slugs: { orderBy: { createdAt: "desc" }, take: 1 },
							},
						},
					},
				},
				createdBy: true,
			}
		);

		if (!comment) {
			return null;
		}

		revalidatePath(`/app/folders/${comment.file.folder.slug}`);
		return comment;
	} catch (e) {
		console.log("Error updating comment", e);
		return null;
	}
}
