'use client'

import { ImagePreviewGrid } from "@/components/images/ImagePreviewGrid";
import React, { Fragment, useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash2, X, Pencil } from "lucide-react";
import { DeleteMultipleImagesDialog } from "@/components/images/DeleteMultipleImagesDialog";
import { CarouselDialog } from "@/components/images/CarouselDialog";
import { FolderWithImagesWithFolderAndComments, FolderWithVideosWithFolderAndComments, ImageWithComments, ImageWithFolder, VideoWithComments, VideoWithFolder } from "@/lib/definitions";
import { cn, formatBytes, getSortedImagesVideosContent } from "@/lib/utils";
import { ImagesSortMethod } from "../folders/SortImages";
import { UploadImagesForm } from "./UploadImagesForm";
import EditDescriptionDialog from "../folders/EditDescriptionDialog";
import { useSession } from "@/providers/SessionProvider";
import { deleteFolderDescription } from "@/actions/folders";
import DeleteDescriptionDialog from "../folders/DeleteDescriptionDialog";

export const ImagesGrid = ({ folder, sortState }: { folder: FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments, sortState: ImagesSortMethod }) => {
    const { user } = useSession();
    const t = useTranslations("images");
    const deleteMultipleTranslations = useTranslations("dialogs.images.deleteMultiple");
    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [startIndex, setStartIndex] = useState(0);

    const [selecting, setSelecting] = useState<boolean>(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [sizeSelected, setSizeSelected] = useState<number>(0);

    const concatImagesVideos = useMemo(() => folder.images.concat(folder.videos), [folder.images, folder.videos]);


    useEffect(() => {
        if (selected.length === 0) {
            setSelecting(false);
            setSizeSelected(0);
        }
    }, [selected]);

    return (
        <div className="mt-10">
            {selecting
                ? <div className={"flex justify-between items-center mb-5 bg-gray-50 dark:bg-primary/30 rounded-2xl w-full p-2"}>
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
            <div className={cn(
                concatImagesVideos.length === 0 ? "flex flex-col lg:flex-row justify-center" : "grid grid-cols-[repeat(auto-fill,16rem)] gap-3 mx-auto",
            )}>
                {folder.description
                    ? <div className={cn("w-full lg:max-w-64 max-h-[200px] relative group overflow-auto",
                        "border border-primary rounded-lg p-4"
                    )}>
                        <p className={"text-sm text-muted-foreground whitespace-pre-wrap"}>{folder.description}</p>
                        {folder.createdById === user?.id
                            ? <div className="flex flex-col gap-2 absolute top-2 right-2 group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                                <EditDescriptionDialog folder={folder}>
                                    <Button variant="ghost" size="icon"><Pencil className={"w-4 h-4"} /></Button>
                                </EditDescriptionDialog>
                                <DeleteDescriptionDialog folder={folder}>
                                    <Button variant="ghost" size="icon"><Trash2 className={"w-4 h-4"} /></Button>
                                </DeleteDescriptionDialog>
                            </div>
                            : null
                        }
                    </div>
                    : null
                }
                {concatImagesVideos.length === 0
                    ? <div className={"col-start-1 col-end-3 xl:col-start-2 xl:col-end-4 2xl:col-start-3 2xl:col-end-5 mx-auto mt-6 flex flex-col justify-center items-center max-w-lg"}>
                        <UploadImagesForm folderId={folder.id} />
                    </div>
                    : (getSortedImagesVideosContent(concatImagesVideos, sortState) as ((ImageWithFolder & ImageWithComments) | (VideoWithFolder & VideoWithComments))[]).map((file: (ImageWithFolder & ImageWithComments) | (VideoWithFolder & VideoWithComments)) => (
                        <Fragment key={file.id}>
                            <ImagePreviewGrid
                                file={file}
                                selected={selected}
                                onClick={(e) => {
                                    if (selecting) {
                                        if (e?.shiftKey && selected.length > 0) {
                                            const lastSelectedId = selected[selected.length - 1];
                                            const lastSelectedIndex = concatImagesVideos.findIndex((item) => item.id === lastSelectedId);
                                            const currentIndex = concatImagesVideos.findIndex((item) => item.id === file.id);

                                            if (lastSelectedIndex !== -1 && currentIndex !== -1) {
                                                const start = Math.min(lastSelectedIndex, currentIndex);
                                                const end = Math.max(lastSelectedIndex, currentIndex);
                                                const range = concatImagesVideos.slice(start, end + 1);

                                                const newSelectedIds = range.map((item) => item.id);
                                                const newSize = range.reduce((acc, item) => acc + item.size, 0);

                                                setSelected([...new Set([...selected, ...newSelectedIds])]);
                                                setSizeSelected(sizeSelected + newSize);
                                            }
                                        } else if (selected.includes(file.id)) {
                                            setSelected(selected.filter((id) => id !== file.id));
                                            setSizeSelected(sizeSelected - file.size);
                                        } else {
                                            setSelected([...selected, file.id]);
                                            setSizeSelected(sizeSelected + file.size);
                                        }
                                    } else {
                                        setStartIndex(concatImagesVideos.indexOf(file));
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

            <CarouselDialog files={concatImagesVideos} title={folder.name} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteMultipleImagesDialog images={selected} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple} onDelete={() => {
                setSelected([]);
                setSelecting(false);
            }} />
        </div>
    )
}
