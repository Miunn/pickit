"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {FolderPlus, Loader2} from "lucide-react";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";

import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {createFolder, deleteFolder, renameFolder} from "@/actions/actions";
import {useState} from "react";
import {toast} from "@/hooks/use-toast";
import {useTranslations} from "next-intl";
import {CreateFolderFormSchema} from "@/lib/definitions";

export default function DeleteFolderDialog({openState, setOpenState, folderId, folderName}: { folderId: string, folderName: string }) {

    const t = useTranslations("folders.dialog.delete");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        const r = await deleteFolder(folderId);

        if (r.ok) {
            toast({
                title: "Folder deleted",
                description: "The folder was deleted successfully.",
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
                        ? <Button disabled={true} variant="destructive"><Loader2 className={"mr-2"}/> {t('submitting')}</Button>
                        : <Button onClick={submit} variant="destructive">{t('submit')}</Button>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
