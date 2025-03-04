'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React, { useState } from "react";
import ImagesCarousel from "./ImagesCarousel";
import { ImageWithComments, ImageWithFolder } from "@/lib/definitions";
import { useTranslations } from "next-intl";

export const CarouselDialog = ({ images, title, carouselOpen, setCarouselOpen, startIndex }: {
    images: (ImageWithFolder & ImageWithComments)[],
    title: string,
    carouselOpen: any,
    setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>,
    startIndex: number
}) => {
    const t = useTranslations("dialogs.images.carousel");
    const [current, setCurrent] = useState<number>(startIndex);

    return (
        <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
            <DialogContent className={"w-full max-w-3xl"}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>

                <ImagesCarousel images={images} startIndex={startIndex} currentIndex={current} setCurrentIndex={setCurrent} />
            </DialogContent>
        </Dialog>
    )
}
