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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteImage } from "@/actions/images";
import { toast } from "@/hooks/use-toast";

export const DeleteImageDialog = ({ image, open, setOpen }: { image: any, open: boolean, setOpen: any }) => {

    const t = useTranslations("dialogs.images.delete");
    const [deleting, setDeleting] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description', { image: image?.name })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose>
                        <Button variant="outline">{t('actions.cancel')}</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        setDeleting(true);
                        deleteImage(image.id).then(r => {
                            setDeleting(false);
                            if (r.error) {
                                toast({
                                    title: t('errors.unknown.title'),
                                    description: t('errors.unknown.description'),
                                    variant: "destructive"
                                });
                                return
                            }

                            setOpen(false);
                            toast({
                                title: t('success.title'),
                                description: t('success.description'),
                            });
                        })
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
