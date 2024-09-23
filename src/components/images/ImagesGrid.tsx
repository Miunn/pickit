"use client";

import {ImagePreview} from "@/components/images/ImagePreview";
import React, {useEffect, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/carousel";
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger} from "@/components/ui/context-menu";
import {deleteImage} from "@/actions/actions";
import {useTranslations} from "next-intl";
import {toast} from "@/hooks/use-toast";
import {DeleteImageDialog} from "@/components/images/DeleteImageDialog";

export const ImagesGrid = ({folder}) => {

    const t = useTranslations("images");
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [carouselOpen, setCarouselOpen] = useState(false);
    const [count, setCount] = useState(folder.images.length);
    const [current, setCurrent] = useState(0);
    const [startIndex, setStartIndex] = useState(0);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectImageToDelete, setSelectImageToDelete] = useState(null);

    useEffect(() => {
        if (!carouselApi) return;

        setCount(carouselApi.scrollSnapList().length);
        setCurrent(carouselApi.selectedScrollSnap() + 1);

        carouselApi.on("select", () => {
            setCurrent(carouselApi.selectedScrollSnap() + 1);
        })
    }, [carouselApi]);

    return (
        <div>
            <div className={"flex flex-wrap gap-3"}>
                {folder.images.map((image: any, index) => (
                    <ContextMenu key={image.id}>
                        <ContextMenuTrigger>
                    <button onClick={() => {
                        setStartIndex(index);
                        setCarouselOpen(!carouselOpen)
                    }} style={{all: "unset", cursor: "pointer"}}>
                        <ImagePreview image={image} folder={folder}/>
                    </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => {
                                setStartIndex(index);
                                setCarouselOpen(!carouselOpen);
                            }}>
                                {t('actions.view')}
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => {
                                setSelectImageToDelete(image);
                                setOpenDelete(true);
                            }}>
                                {t('actions.delete')}
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                ))}
            </div>
            <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
                <DialogContent className={"w-full max-w-3xl"}>
                    <DialogHeader>
                        <DialogTitle>{folder.name}</DialogTitle>
                        <DialogDescription>Images</DialogDescription>
                    </DialogHeader>

                    <div className={"p-4 mx-auto"}>
                        <Carousel className="w-full max-w-xl h-96" opts={{
                            align: "center",
                            loop: true,
                            startIndex: startIndex
                        }} setApi={setCarouselApi}>
                            <CarouselContent>
                                {folder.images.map((image) => (
                                    <CarouselItem key={image.id} className={"max-h-96"}>
                                        <div className={"w-full h-full max-h-96 flex justify-center items-center p-2"}>
                                            <img src={`/api/folders/${folder.id}/images/${image.id}`}
                                                 alt={image.name} className={"max-h-96 object-cover rounded-md"}/>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious/>
                            <CarouselNext/>
                        </Carousel>
                        <div className="py-2 text-sm flex justify-between items-center">
                        <span>{
                            current == 0
                                ? folder.images[current].name
                                : folder.images[current - 1].name
                        }</span>
                            <span className="text-muted-foreground">Slide {current} of {count}</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <DeleteImageDialog image={selectImageToDelete} open={openDelete} setOpen={setOpenDelete} />
        </div>
    )
}
