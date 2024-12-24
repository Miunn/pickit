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
import {useState} from "react";
import {Loader2} from "lucide-react";
import {deleteImage} from "@/actions/images";
import {toast} from "@/hooks/use-toast";

export const DeleteImageDialog = ({image, open, setOpen}: { image: any, open: boolean, setOpen: any }) => {

    const t = useTranslations("images.dialog.delete");
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
                        <Button variant="outline">{t('cancel')}</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        setDeleting(true);
                        deleteImage(image.id).then(r => {
                            setDeleting(false);
                            if (!r.error) {
                                toast({
                                    title: "Image deleted",
                                    description: "The image has been deleted successfully",
                                });
                                setOpen(false);
                            } else {
                                toast({
                                    title: "Error",
                                    description: r.error,
                                    variant: "destructive"
                                });
                            }
                        })
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
