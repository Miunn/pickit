"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React from "react";
import ImagesCarousel from "@/components/files/carousel/ImagesCarousel";
import { useTranslations } from "next-intl";

export const CarouselDialog = ({
    title,
    carouselOpen,
    setCarouselOpen,
    startIndex,
}: {
    readonly title: string;
    readonly carouselOpen: boolean;
    readonly setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>;
    readonly startIndex: number;
}) => {
    const t = useTranslations("dialogs.images.carousel");

    return (
        <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
            <DialogContent className="w-[min(98vw,1600px)] max-w-none max-h-[98vh] overflow-y-auto">
                <DialogHeader className="shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <ImagesCarousel startIndex={startIndex} />
            </DialogContent>
        </Dialog>
    );
};
