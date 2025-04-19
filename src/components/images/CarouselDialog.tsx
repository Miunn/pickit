'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React, { useState } from "react";
import ImagesCarousel from "./ImagesCarousel";
import { ImageWithComments, ImageWithFolder, VideoWithComments, VideoWithFolder } from "@/lib/definitions";
import { useTranslations } from "next-intl";

export const CarouselDialog = ({ files, title, carouselOpen, setCarouselOpen, startIndex }: {
    files: ((ImageWithFolder & ImageWithComments) | (VideoWithFolder & VideoWithComments))[],
    title: string,
    carouselOpen: any,
    setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>,
    startIndex: number
}) => {
    const t = useTranslations("dialogs.images.carousel");

    return (
        <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
            <DialogContent className={"w-full max-w-3xl"}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>

                <ImagesCarousel files={files} startIndex={startIndex} />
            </DialogContent>
        </Dialog>
    )
}
