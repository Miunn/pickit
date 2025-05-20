import { Comment as CommentType } from "@prisma/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import DeleteCommentDialog from "./DeleteCommentDialog";
import { useSession } from "@/providers/SessionProvider";
import { useFolderContext } from "@/context/FolderContext";
import EditCommentDialog from "./EditCommentDialog";
import { useFilesContext } from "@/context/FilesContext";

export function Comment({ comment }: { comment: CommentType }) {
    const { user } = useSession();
    const token = (() => {
        try {
            return useFolderContext().token;
        } catch (error) {
            return undefined;
        }
    })();
    const { files, setFiles } = useFilesContext();

    const formatter = useFormatter();
    const t = useTranslations("components.images.comments.comment.dropdown");
    const [openDelete, setOpenDelete] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);

    const canEditComment = comment.createdById === user?.id || (token && 'email' in token && comment.createdByEmail === token.email);

    return (
        <div className="relative">
            <p className="text-sm font-semibold flex items-center gap-2">
                {comment.name}
                <Tooltip>
                    <TooltipTrigger>
                        <span className="font-light text-gray-500">{formatter.relativeTime(comment.createdAt, new Date())}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span className="capitalize">{formatter.dateTime(comment.createdAt, { weekday: "long", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "numeric" })}</span>
                    </TooltipContent>
                </Tooltip>
            </p>
            <p className="text-sm">{comment.text}</p>

            {canEditComment ? (
                <DropdownMenu>
                    <DropdownMenuTrigger className="absolute top-0 right-0" asChild>
                        <Button variant="ghost" size="icon" className="w-6 h-6 p-0">
                            <Ellipsis className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setOpenEdit(true)}>{t("edit")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-destructive font-semibold">{t("delete")}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}

            <EditCommentDialog
                comment={comment}
                open={openEdit}
                setOpen={setOpenEdit}
            />

            <DeleteCommentDialog
                comment={comment} 
                open={openDelete} 
                setOpen={setOpenDelete}
                onDelete={() => {
                    setFiles(files.map((file) => ({ ...file, comments: file.comments.filter((c) => c.id !== comment.id) })))
                }}
            />
        </div>
    )
}