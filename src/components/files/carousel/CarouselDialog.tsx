"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React from "react";
import ImagesCarousel from "./ImagesCarousel";
import { useTranslations } from "next-intl";

export const CarouselDialog = ({
    title,
    carouselOpen,
    setCarouselOpen,
    startIndex,
}: {
    title: string;
    carouselOpen: boolean;
    setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>;
    startIndex: number;
}) => {
    const t = useTranslations("dialogs.images.carousel");

    return (
        <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
            <DialogContent className={"w-full max-w-4xl"}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <ImagesCarousel startIndex={startIndex} />
            </DialogContent>
        </Dialog>
    );
};
