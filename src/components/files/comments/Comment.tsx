import { Comment as CommentType } from "@prisma/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import DeleteCommentDialog from "@/components/files/comments/DeleteCommentDialog";
import { useFolderContext } from "@/context/FolderContext";
import EditCommentDialog from "@/components/files/comments/EditCommentDialog";
import { useFilesContext } from "@/context/FilesContext";
import { useSession } from "@/lib/auth-client";

export function Comment({ comment }: { readonly comment: CommentType }) {
	const { data: session } = useSession();
	const { token } = useFolderContext();
	const { files, setFiles } = useFilesContext();

	const formatter = useFormatter();
	const t = useTranslations("components.images.comments.comment.dropdown");
	const [openDelete, setOpenDelete] = useState(false);
	const [openEdit, setOpenEdit] = useState(false);

	const canEditComment =
		comment.createdById === session?.user?.id ||
		(token && "email" in token && comment.createdByEmail === token.email);

	return (
		<div className="relative">
			<div className="text-sm font-semibold flex items-center gap-2">
				<p>{comment.name}</p>
				<Tooltip>
					<TooltipTrigger>
						<p className="font-light text-gray-500">
							{formatter.relativeTime(comment.createdAt, new Date())}
						</p>
					</TooltipTrigger>
					<TooltipContent>
						<span className="capitalize">
							{formatter.dateTime(comment.createdAt, {
								weekday: "long",
								day: "numeric",
								month: "short",
								year: "numeric",
								hour: "numeric",
								minute: "numeric",
							})}
						</span>
					</TooltipContent>
				</Tooltip>
			</div>
			<p className="text-sm">{comment.text}</p>

			{canEditComment ? (
				<DropdownMenu>
					<DropdownMenuTrigger className="absolute top-0 right-0" asChild>
						<Button variant="ghost" size="icon" className="w-6 h-6 p-0">
							<Ellipsis className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem onClick={() => setOpenEdit(true)}>
							{t("edit")}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setOpenDelete(true)}
							className="text-destructive font-semibold"
						>
							{t("delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}

			<EditCommentDialog comment={comment} open={openEdit} setOpen={setOpenEdit} />

			<DeleteCommentDialog
				comment={comment}
				open={openDelete}
				setOpen={setOpenDelete}
				onDelete={() => {
					setFiles(
						files.map(file => ({
							...file,
							comments: file.comments.filter(c => c.id !== comment.id),
						}))
					);
				}}
			/>
		</div>
	);
}
