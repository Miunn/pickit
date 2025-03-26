'use client'

import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUp } from "lucide-react";
import { useState } from "react";
import UploadImagesForm from "./UploadImagesForm";

export const UploadImagesDialog = ({ folderId, open, setOpen }: { folderId: string, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const t = useTranslations("images.dialog.upload");

    const [internalOpen, setInternalOpen] = useState(false);

    const openState = open ?? internalOpen;
    const setOpenState = setOpen ?? setInternalOpen;

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            {!open && !setOpen
                ? <DialogTrigger asChild>
                    <Button variant="outline" className={"w-fit flex items-center"}>
                        <ImageUp className={"mr-2"} /> {t('trigger')}
                    </Button>
                </DialogTrigger>
                : null
            }
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>
                <UploadImagesForm folderId={folderId} onUpload={() => setOpenState(false)} />
            </DialogContent>
        </Dialog>
    )
}
