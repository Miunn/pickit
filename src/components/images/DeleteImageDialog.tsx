"use client";

import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteImage } from "@/actions/images";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { ImageWithFolder, VideoWithFolder } from "@/lib/definitions";

export const DeleteImageDialog = ({ file, children, open, setOpen }: { file: ImageWithFolder | VideoWithFolder, children?: React.ReactNode, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const t = useTranslations("dialogs.images.delete");
    const [deleting, setDeleting] = useState(false);
    const searchParams = useSearchParams();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children
                ? <DialogTrigger asChild>
                    { children }
                </DialogTrigger>
                : null
            }
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription className="text-wrap break-all">{t('description', { image: file.name })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('actions.cancel')}</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        setDeleting(true);
                        deleteImage(file.folderId, file.id, file.type, searchParams.get("share") || undefined, searchParams.get("h") || undefined, searchParams.get("t") || undefined).then(r => {
                            setDeleting(false);
                            if (r.error) {
                                toast({
                                    title: t('errors.unknown.title'),
                                    description: t('errors.unknown.description'),
                                    variant: "destructive"
                                });
                                return
                            }

                            if (setOpen) {
                                setOpen(false);
                            }
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
