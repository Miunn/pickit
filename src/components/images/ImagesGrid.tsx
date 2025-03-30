'use client'

import { ImagePreviewGrid } from "@/components/images/ImagePreviewGrid";
import React, { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { DeleteMultipleImagesDialog } from "@/components/images/DeleteMultipleImagesDialog";
import { CarouselDialog } from "@/components/images/CarouselDialog";
import { FolderWithImagesWithFolderAndComments, FolderWithVideosWithFolderAndComments, ImageWithComments, ImageWithFolder, VideoWithComments, VideoWithFolder } from "@/lib/definitions";
import { formatBytes, getSortedImagesVideosContent } from "@/lib/utils";
import { ImagesSortMethod } from "../folders/SortImages";
import UploadImagesForm from "./UploadImagesForm";

export const ImagesGrid = ({ folder, sortState }: { folder: FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments, sortState: ImagesSortMethod }) => {
    const t = useTranslations("images");
    const deleteMultipleTranslations = useTranslations("dialogs.images.deleteMultiple");
    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [startIndex, setStartIndex] = useState(0);

    const [selecting, setSelecting] = useState<boolean>(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [sizeSelected, setSizeSelected] = useState<number>(0);



    useEffect(() => {
        if (selected.length === 0) {
            setSelecting(false);
            setSizeSelected(0);
        }
    }, [selected]);

    return (
        <div>
            {selecting
                ? <div className={"flex justify-between items-center mb-5 bg-gray-50 rounded-2xl w-full p-2"}>
                    <div className={"flex gap-2 items-center"}>
                        <Button variant="ghost" onClick={() => {
                            setSelected([]);
                            setSizeSelected(0);
                            setSelecting(false);
                        }} size="icon"><X className={"w-4 h-4"} /></Button>
                        <h2><span className={"font-semibold"}>{t('selected', { count: selected.length })}</span> - {formatBytes(sizeSelected, { decimals: 2, sizeType: "normal" })}</h2>
                    </div>

                    <Button variant="outline" onClick={() => {
                        setOpenDeleteMultiple(true);
                    }}>
                        <Trash2 className={"mr-2"} /> {deleteMultipleTranslations('trigger')}
                    </Button>
                </div>
                : null
            }
            <div className={"flex flex-wrap gap-3"}>
                {folder.images.length === 0 && folder.videos.length === 0
                    ? <div className={"mx-auto flex flex-col justify-center items-center max-w-lg"}>
                        <UploadImagesForm folderId={folder.id} />
                    </div>
                    : (getSortedImagesVideosContent(folder.images.concat(folder.videos), sortState) as ((ImageWithFolder & ImageWithComments) | (VideoWithFolder & VideoWithComments))[]).map((file: (ImageWithFolder & ImageWithComments) | (VideoWithFolder & VideoWithComments)) => (
                        <Fragment key={file.id}>
                            <ImagePreviewGrid
                                file={file}
                                selected={selected}
                                onClick={(e) => {
                                    if (selecting) {
                                        if (e?.shiftKey) {
                                            if (!selected.includes(file.id)) {
                                                const lastSelected = folder.images.findIndex((img) => img.id === selected[selected.length - 1]);
                                                const currentSelected = folder.images.findIndex((img) => img.id === file.id);
                                                const range = folder.images.slice(Math.min(lastSelected, currentSelected), Math.max(lastSelected, currentSelected) + 1);
                                                setSelected([...selected, ...range.map((img) => img.id)]);
                                                setSizeSelected(sizeSelected + range.reduce((acc, img) => acc + img.size, 0));
                                            }
                                        } else if (selected.includes(file.id)) {
                                            setSelected(selected.filter((id) => id !== file.id));
                                            setSizeSelected(sizeSelected - file.size);
                                        } else {
                                            setSelected([...selected, file.id]);
                                            setSizeSelected(sizeSelected + file.size);
                                        }
                                    } else {
                                        setStartIndex(folder.images.indexOf(file));
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
                    ))}
            </div>

            <CarouselDialog files={folder.images.map((i) => ({ ...i, type: 'image'})).concat(folder.videos.map((v) => ({ ...v, type: 'video' })))} title={folder.name} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteMultipleImagesDialog images={selected} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple} onDelete={() => {
                setSelected([]);
                setSelecting(false);
            }} />
        </div>
    )
}
