"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteComment } from "@/actions/comments";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Comment } from "@prisma/client";

export default function DeleteCommentDialog({
    comment,
    open,
    setOpen,
    children,
    onDelete,
}: {
    readonly comment: Comment;
    readonly open?: boolean;
    readonly setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    readonly children?: React.ReactNode;
    readonly onDelete?: () => void;
}) {
    const t = useTranslations("dialogs.comments.delete");
    const [deleting, setDeleting] = useState(false);
    const searchParams = useSearchParams();

    const submit = async () => {
        setDeleting(true);
        const r = await deleteComment(comment.id, searchParams.get("share"), searchParams.get("h"));
        setDeleting(false);

        if (!r) {
            toast({
                title: t("errors.unknown.title"),
                description: t("errors.unknown.description"),
                variant: "destructive",
            });
            return;
        }

        if (setOpen) {
            setOpen(false);
        }

        if (onDelete) {
            onDelete();
        }

        toast({
            title: t("success.title"),
            description: t("success.description"),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => setOpen?.(false)} variant="outline">
                        {t("actions.cancel")}
                    </Button>
                    {deleting ? (
                        <Button disabled={true} variant="destructive">
                            <Loader2 className={"mr-2 animate-spin"} /> {t("actions.submitting")}
                        </Button>
                    ) : (
                        <Button onClick={submit} variant="destructive">
                            {t("actions.submit")}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
