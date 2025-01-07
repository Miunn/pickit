"use client";

import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteImages } from "@/actions/images";
import { toast } from "@/hooks/use-toast";

export const DeleteMultipleImagesDialog = ({ images, open, setOpen, setSelected, setSelecting }: { images: any[], open: boolean, setOpen: any, setSelected: React.Dispatch<React.SetStateAction<string[]>>, setSelecting: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const t = useTranslations("dialogs.images.deleteMultiple");
    const [deleting, setDeleting] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description', { n: images.length })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose>
                        <Button variant="outline">{t('actions.cancel')}</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        setDeleting(true);
                        deleteImages(images)
                            .then(r => {
                                if (r.error) {
                                    toast({
                                        title: t('errors.unknown.title'),
                                        description: t('errors.unknown.description'),
                                    });
                                    return;
                                }

                                setSelected([]);
                                setSelecting(false);
                                setDeleting(false);
                                setOpen(false);

                                toast({
                                    title: t('success.title'),
                                    description: t('success.description', { n: images.length }),
                                });
                            });
                    }} disabled={deleting} variant={"destructive"}>{
                            deleting ? (
                                <>
                                    <Loader2 className={"animate-spin mr-2"} /> {t('actions.submitting')}
                                </>
                            )
                                : t('actions.submit')
                        }</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
