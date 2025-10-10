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
import { deleteFolder } from "@/actions/folders";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

export default function DeleteFolderDialog({
    openState,
    setOpenState,
    folderId,
    folderName,
}: {
    openState: boolean;
    setOpenState: (open: boolean) => void;
    folderId: string;
    folderName: string;
}) {
    const t = useTranslations("dialogs.folders.delete");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        const r = await deleteFolder(folderId);
        setLoading(false);

        if (r.error) {
            toast({
                title: t("errors.unknown.title"),
                description: t("errors.unknown.description"),
            });
        }

        setOpenState(false);
    };

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description", { folder: folderName })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => setOpenState(false)} variant="outline">
                        {t("actions.cancel")}
                    </Button>
                    {loading ? (
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
