"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { Folder } from "@prisma/client";
import { deleteFolderDescription } from "@/actions/folders";

export default function DeleteDescriptionDialog({
    folder,
    open,
    setOpen,
    children
}: {
    readonly folder: Folder,
    readonly open?: boolean,
    readonly setOpen?: React.Dispatch<React.SetStateAction<boolean>>,
    readonly children?: React.ReactNode
}) {
    const t = useTranslations("dialogs.folders.deleteDescription");
    const [deleting, setDeleting] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);
    const openState = open ?? internalOpen;
    const setOpenState = setOpen ?? setInternalOpen;

    const submit = async () => {
        setDeleting(true);

        const r = await deleteFolderDescription(folder.id);

        setDeleting(false);

        if (r.error) {
            toast({
                title: t('errors.unknown.title'),
                description: t('errors.unknown.description'),
                variant: "destructive"
            });
            return;
        }

        setOpenState(false);

        toast({
            title: t('success.title'),
            description: t('success.description'),
        });
    };

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description', { name: folder.name })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => setOpenState(false)} variant="outline">{t('actions.cancel')}</Button>
                    {deleting
                        ? <Button disabled={true} variant="destructive"><Loader2 className={"mr-2 animate-spin"} /> {t('actions.submitting')}</Button>
                        : <Button onClick={submit} variant="destructive">{t('actions.submit')}</Button>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
