'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React from "react";
import ImagesCarousel from "./ImagesCarousel";
import { FileWithComments, FileWithFolder } from "@/lib/definitions";
import { useTranslations } from "next-intl";

export const CarouselDialog = ({ files, title, carouselOpen, setCarouselOpen, startIndex, setFiles }: {
    files: (FileWithFolder & FileWithComments)[],
    title: string,
    carouselOpen: any,
    setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>,
    startIndex: number,
    setFiles?: (files: (FileWithFolder & FileWithComments)[]) => void
}) => {
    const t = useTranslations("dialogs.images.carousel");

    return (
        <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
            <DialogContent className={"w-full max-w-3xl"}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>

                <ImagesCarousel files={files} startIndex={startIndex} setFiles={setFiles} />
            </DialogContent>
        </Dialog>
    )
}
