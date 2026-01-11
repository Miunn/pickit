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
import { deleteFile } from "@/actions/files";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { FileWithFolder } from "@/lib/definitions";

export const DeleteImageDialog = ({ file, children, open, setOpen }: { readonly file: FileWithFolder, readonly children?: React.ReactNode, readonly open?: boolean, readonly setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const t = useTranslations("dialogs.images.delete");
    const [deleting, setDeleting] = useState(false);
    const searchParams = useSearchParams();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children
                ? <DialogTrigger asChild>
                    {children}
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
                    <Button onClick={async () => {
                        setDeleting(true);
                        const r = await deleteFile(file.id, searchParams.get("share") || undefined, searchParams.get("h") || undefined);
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
        </Dialog >
    )
}
