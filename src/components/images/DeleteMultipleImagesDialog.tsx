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
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { deleteImages } from "@/actions/images";
import { toast } from "@/hooks/use-toast";

export const DeleteMultipleImagesDialog = ({ images, open, setOpen, onDelete }: { images: any[], open: boolean, setOpen: any, onDelete: () => void }) => {

    const t = useTranslations("dialogs.images.deleteMultiple");
    const [deleting, setDeleting] = useState(false);
    const [validImages, setValidImages] = useState<{ id: string; type: string; }[]>([]);

    // Ensure we have valid image IDs
    useEffect(() => {
        if (Array.isArray(images)) {
            // Convert string IDs to the expected format
            setValidImages(images.filter(id => id && typeof id === 'string').map(id => ({ id, type: 'image' })));
        } else {
            setValidImages([]);
        }
    }, [images]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description', { n: validImages.length })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('actions.cancel')}</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        if (validImages.length === 0) {
                            toast({
                                title: t('errors.noImages.title'),
                                description: t('errors.noImages.description'),
                                variant: "destructive"
                            });
                            return;
                        }

                        setDeleting(true);
                        deleteImages(validImages)
                            .then(r => {
                                if (r.error) {
                                    toast({
                                        title: t('errors.unknown.title'),
                                        description: t('errors.unknown.description'),
                                        variant: "destructive"
                                    });
                                    setDeleting(false);
                                    return;
                                }

                                onDelete();
                                setDeleting(false);
                                setOpen(false);

                                toast({
                                    title: t('success.title'),
                                    description: t('success.description', { n: validImages.length }),
                                });
                            })
                            .catch(error => {
                                console.error("Error deleting images:", error);
                                toast({
                                    title: t('errors.unknown.title'),
                                    description: t('errors.unknown.description'),
                                    variant: "destructive"
                                });
                                setDeleting(false);
                            });
                    }} disabled={deleting || validImages.length === 0} variant={"destructive"}>{
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
