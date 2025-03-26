'use client'

import { useFormatter, useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";
import Image from "next/image";
import { ImageWithFolder } from "@/lib/definitions";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "../ui/context-menu";
import { downloadClientImageHandler, formatBytes } from "@/lib/utils";
import saveAs from "file-saver";
import { toast } from "@/hooks/use-toast";
import ImagePropertiesDialog from "./ImagePropertiesDialog";
import { DeleteImageDialog } from "./DeleteImageDialog";
import { useSearchParams } from "next/navigation";
import RenameImageDialog from "./RenameImageDialog";
import { changeFolderCover } from "@/actions/folders";

export interface ImagePreviewProps {
    image: ImageWithFolder;
    selected: string[];
    onClick: (e?: React.MouseEvent) => void;
    onSelect: () => void;
}

export const ImagePreviewGrid = ({ image, selected, onClick, onSelect }: ImagePreviewProps) => {
    const format = useFormatter();
    const t = useTranslations("images");
    const deleteTranslations = useTranslations("dialogs.images.delete");
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t");

    const [openRename, setOpenRename] = React.useState(false);
    const [openProperties, setOpenProperties] = React.useState(false);
    const [openDelete, setOpenDelete] = React.useState(false);

    return (
        <>
            <ContextMenu key={image.id} modal={false}>
                <ContextMenuTrigger asChild>
                    <button onClick={onClick} style={{ all: "unset", cursor: "pointer" }}>
                        <div className={`inline-block w-64 rounded-2xl ${selected.includes(image.id) ? "bg-accent" : ""}`}>
                            <div className={`${selected.includes(image.id) ? "scale-95" : ""}`}>
                                <div className={`relative h-36 mb-4 flex justify-center items-center`}>
                                    <Image src={`/api/folders/${image.folderId}/images/${image.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType}`} alt={image.name}
                                        className={"relative border border-primary rounded-xl object-cover"} sizes="33vw" fill />
                                </div>
                                <p className={"text-start truncate"}>{image.name}</p>
                                <div className={"text-sm h-4 flex items-center justify-between"}>
                                    <div className="h-full flex items-center">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className={"text-sm opacity-60 capitalize truncate"}>{format.dateTime(image.createdAt, {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}</p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className={"text-sm capitalize truncate"}>{format.dateTime(image.createdAt, {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "numeric",
                                                        minute: "numeric"
                                                    })}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <p className="text-muted-foreground text-nowrap">{formatBytes(image.size)}</p>
                                </div>
                            </div>
                        </div>
                    </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={onClick}>
                        {t('actions.view')}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={onSelect}>
                        {t('actions.select')}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => downloadClientImageHandler(image)}>
                        {t('actions.download')}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenRename(true)}>
                        {t('actions.rename')}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={async () => {
                        const r = await changeFolderCover(image.folderId, image.id);

                        if (r.error) {
                            toast({
                                title: t('actions.setAsCover.error.title'),
                                description: t('actions.setAsCover.error.description'),
                                variant: "destructive"
                            });
                            return;
                        }

                        toast({
                            title: t('actions.setAsCover.success.title'),
                            description: t('actions.setAsCover.success.description')
                        });
                    }}>{t('actions.setAsCover.label')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenProperties(true)}>
                        {t('actions.properties')}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setOpenDelete(true)} className="text-red-600 focus:text-red-600 font-semibold">
                        {deleteTranslations('trigger')}
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <RenameImageDialog image={image} openState={openRename} setOpenState={setOpenRename} />
            <DeleteImageDialog image={image} open={openDelete} setOpen={setOpenDelete} />
            <ImagePropertiesDialog image={image} open={openProperties} setOpen={setOpenProperties} />
        </>
    )
}
