"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Loader2} from "lucide-react";
import {deleteFolder} from "@/actions/folders";
import {useState} from "react";
import {toast} from "@/hooks/use-toast";
import {useTranslations} from "next-intl";

export default function DeleteFolderDialog({openState, setOpenState, folderId, folderName}: { openState: boolean, setOpenState: any, folderId: string, folderName: string }) {

    const t = useTranslations("folders.dialog.delete");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        const r = await deleteFolder(folderId);

        if (r.ok) {
            toast({
                title: "Folder deleted",
                description: "The folders was deleted successfully.",
            });
            setOpenState(false);
        }

        setLoading(false);
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description', {folder: folderName})}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => setOpenState(false)} variant="outline">{t('cancel')}</Button>
                    {loading
                        ? <Button disabled={true} variant="destructive"><Loader2 className={"mr-2 animate-spin"}/> {t('submitting')}</Button>
                        : <Button onClick={submit} variant="destructive">{t('submit')}</Button>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
