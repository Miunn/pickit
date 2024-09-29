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
import {deleteImage, deleteImages} from "@/actions/actions";
import {useTranslations} from "next-intl";
import {toast} from "@/hooks/use-toast";
import {DeleteImageDialog} from "@/components/images/DeleteImageDialog";
import {Button} from "@/components/ui/button";
import {Trash, Trash2, X} from "lucide-react";
import {DeleteMultipleImagesDialog} from "@/components/images/DeleteMultipleImagesDialog";
import {CarouselDialog} from "@/components/images/CarouselDialog";

export const ImagesGrid = ({folder}) => {

    const t = useTranslations("images");
    const [carouselOpen, setCarouselOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState(false);
    const [selectImageToDelete, setSelectImageToDelete] = useState(null);
    const [startIndex, setStartIndex] = useState(0);

    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState([]);

    const addSelected = (image) => {
        setSelected([...selected, image.id]);
    }

    const removeSelected = (image) => {
        setSelected(selected.filter((id) => id !== image.id));
    }

    useEffect(() => {
        if (selected.length === 0) {
            setSelecting(false);
        }
    }, [selected]);



    return (
        <div>
            {selecting
                ? <div className={"flex justify-between items-center mb-5 bg-gray-50 rounded-2xl w-full p-2"}>
                    <div className={"flex gap-2 items-center"}>
                    <Button variant="ghost" onClick={() => {
                        setSelected([]);
                        setSelecting(false);
                    }} size="icon"><X className={"w-4 h-4"}/></Button>
                    <h2 className={"font-semibold"}>{selected.length} {t('selected')}</h2>
                    </div>

                    <Button variant="outline" onClick={() => {
                        setOpenDeleteMultiple(true);
                    }}>
                        <Trash2 className={"mr-2"}/> {t('actions.delete')}
                    </Button>
                </div>
                : null
            }
            <div className={"flex flex-wrap gap-3"}>
                {folder.images.map((image: any, index) => (
                    <ContextMenu key={image.id}>
                        <ContextMenuTrigger>
                            <button onClick={() => {
                                if (selecting) {
                                    if (selected.includes(image.id)) {
                                        removeSelected(image);
                                    } else {
                                        addSelected(image);
                                    }
                                } else {
                                    setStartIndex(index);
                                    setCarouselOpen(!carouselOpen)
                                }
                            }} style={{all: "unset", cursor: "pointer"}}>
                                <ImagePreview image={image} folder={folder} selected={selected.includes(image.id)}/>
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
                                setSelecting(true);
                                addSelected(image);
                            }}>
                                {t('actions.select')}
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

            <CarouselDialog images={folder.images} title={folder.name} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex}/>
            <DeleteImageDialog image={selectImageToDelete} open={openDelete} setOpen={setOpenDelete}/>
            <DeleteMultipleImagesDialog images={selected} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple} setSelected={setSelected} setSelecting={setSelecting} />
        </div>
    )
}
