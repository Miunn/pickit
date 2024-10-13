"use client";

import {ImageOff, Trash2, X} from "lucide-react";
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger} from "@/components/ui/context-menu";
import {ImagePreview} from "@/components/images/ImagePreview";
import {CarouselDialog} from "@/components/images/CarouselDialog";
import {DeleteImageDialog} from "@/components/images/DeleteImageDialog";
import {DeleteMultipleImagesDialog} from "@/components/images/DeleteMultipleImagesDialog";
import React, {useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";

export const LastUploadedImages = ({images, locale}: { images: any[], locale: string }) => {
    const t = useTranslations("images");

    const [carouselOpen, setCarouselOpen] = React.useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState(false);
    const [startIndex, setStartIndex] = React.useState(0);
    const [selectImageToDelete, setSelectImageToDelete] = useState(null);
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
        <>
            <h2 className={"font-semibold mb-5"}>{t('lastUploadedImages')}</h2>

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
            <div className={`flex flex-wrap gap-3 ${images.length == 0 && "justify-center"}`}>
                {images.length == 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <ImageOff className={"w-32 h-32 opacity-20"}/>
                        <p>{t('empty')}</p>
                    </div>
                    : images.map((image, index) => (
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
                                    <ImagePreview key={image.id} image={image} folder={image.folder} locale={locale}
                                                  withFolder={true}/>
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
                    ))
                }
            </div>

            <CarouselDialog images={images} title={"Last uploaded images"} carouselOpen={carouselOpen}
                            setCarouselOpen={setCarouselOpen} startIndex={startIndex}/>
            <DeleteImageDialog image={selectImageToDelete} open={openDelete} setOpen={setOpenDelete}/>
            <DeleteMultipleImagesDialog images={selected} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple}
                                        setSelected={setSelected} setSelecting={setSelecting}/>
        </>
    )
}
