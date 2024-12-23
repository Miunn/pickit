import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import React, { useState } from "react";
import ImagesCarousel from "./ImagesCarousel";

export const CarouselDialog = ({images, title, carouselOpen, setCarouselOpen, startIndex}: {
    images: any[],
    title: string,
    carouselOpen: any,
    setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>,
    startIndex: number
}) => {

    const [current, setCurrent] = useState<number>(startIndex);

    return (
        <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
            <DialogContent className={"w-full max-w-3xl"}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Images</DialogDescription>
                </DialogHeader>

                <ImagesCarousel images={images} startIndex={startIndex} currentIndex={current} setCurrentIndex={setCurrent} />
            </DialogContent>
        </Dialog>
    )
}
