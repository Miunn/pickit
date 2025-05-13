"use client";

import { ImageOff, Trash2, X } from "lucide-react";
import { ImagePreviewGrid } from "@/components/images/views/grid/ImagePreviewGrid";
import { CarouselDialog } from "@/components/images/carousel/CarouselDialog";
import { DeleteMultipleImagesDialog } from "@/components/images/DeleteMultipleImagesDialog";
import React, { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFilesContext } from "@/context/FilesContext";
export const LastUploadedImages = () => {
    const { files } = useFilesContext();
    const t = useTranslations("pages.dashboard.images");

    const [carouselOpen, setCarouselOpen] = React.useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [startIndex, setStartIndex] = React.useState(0);
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [sizeSelected, setSizeSelected] = useState<number>(0);

    useEffect(() => {
        if (selected.length === 0) {
            setSelecting(false);
            setSizeSelected(0);
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
                        }} size="icon"><X className={"size-4"} /></Button>
                        <h2 className={"font-semibold"}>{t('selected', { count: selected.length })}</h2>
                    </div>

                    <Button variant="outline" onClick={() => {
                        setOpenDeleteMultiple(true);
                    }}>
                        <Trash2 className={"mr-2"} /> {t('actions.delete')}
                    </Button>
                </div>
                : null
            }
            <div className={`flex flex-wrap gap-3 ${files.length == 0 && "justify-center"}`}>
                {files.length == 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <ImageOff className={"w-32 h-32 opacity-20"} />
                        <p>{t('empty')}</p>
                    </div>
                    : files.map((file, index) => (
                        <Fragment key={file.id}>
                        <ImagePreviewGrid
                            file={file}
                            selected={selected}
                            onClick={(e) => {
                                if (selecting) {
                                    if (e?.shiftKey) {
                                        if (!selected.includes(file.id)) {
                                            const lastSelected = files.findIndex((f) => f.id === selected[selected.length - 1]);
                                            const currentSelected = files.findIndex((f) => f.id === file.id);
                                            const range = files.slice(Math.min(lastSelected, currentSelected), Math.max(lastSelected, currentSelected) + 1);
                                            setSelected([...selected, ...range.map((f) => f.id)]);
                                            setSizeSelected(sizeSelected + range.reduce((acc, f) => acc + f.size, 0));
                                        }
                                    } else if (selected.includes(file.id)) {
                                        setSelected(selected.filter((id) => id !== file.id));
                                        setSizeSelected(sizeSelected - file.size);
                                    } else {
                                        setSelected([...selected, file.id]);
                                        setSizeSelected(sizeSelected + file.size);
                                    }
                                } else {
                                    setStartIndex(index);
                                    setCarouselOpen(true);
                                }
                            }}
                            onSelect={() => {
                                if (selected.includes(file.id)) {
                                    setSelected(selected.filter((id) => id !== file.id));
                                    setSizeSelected(sizeSelected - file.size);
                                } else {
                                    setSelecting(true);
                                    setSelected([...selected, file.id]);
                                    setSizeSelected(sizeSelected + file.size);
                                }
                            }}
                        />
                        </Fragment>
                    ))
                }
            </div>

            <CarouselDialog title={"Last uploaded files"} carouselOpen={carouselOpen}
                setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteMultipleImagesDialog files={files.filter((file) => selected.includes(file.id))} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple} onDelete={() => {
                setSelected([]);
                setSizeSelected(0);
                setSelecting(false);
            }} />
        </>
    )
}
