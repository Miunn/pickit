"use client";

import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import React, {useState} from "react";
import {Loader2} from "lucide-react";
import {deleteImage, deleteImages} from "@/actions/actions";
import {toast} from "@/hooks/use-toast";

export const DeleteMultipleImagesDialog = ({images, open, setOpen, setSelected, setSelecting}: { images: any[], open: boolean, setOpen: any, setSelected: React.Dispatch<React.SetStateAction<string[]>>, setSelecting: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const t = useTranslations("images.dialog.deleteMultiple");
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
                        <Button variant="outline">{t('cancel')}</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        setDeleting(true);
                        deleteImages(images)
                            .then(r => {
                                if (!r?.error) {
                                    toast({
                                        title: "Images deleted",
                                        description: "The images have been deleted successfully",
                                    });
                                    setSelected([]);
                                    setSelecting(false);
                                    setDeleting(false);
                                    setOpen(false);
                                }
                            });
                    }} disabled={deleting}>{
                        deleting ? (
                                <>
                                    <Loader2 className={"animate-spin mr-2"}/> {t('submitting')}
                                </>
                            )
                            : t('submit')
                    }</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
