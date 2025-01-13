import { useFormatter, useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";
import Image from "next/image";
import { ImageWithFolder } from "@/lib/definitions";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import { formatBytes } from "@/lib/utils";

export interface ImagePreviewProps {
    image: ImageWithFolder;
    selecting: boolean;
    setSelecting: React.Dispatch<React.SetStateAction<boolean>>;
    selected: string[];
    setSelected: React.Dispatch<React.SetStateAction<string[]>>;
    onClick?: (imageId: string) => void;
    onDelete?: (imageId: string) => void;
    shareToken?: string | null;
    shareHashPin?: string | null;
    tokenType?: string;
}

export const ImagePreview = ({ image, selecting, setSelecting, selected, setSelected, onClick, onDelete, shareToken, shareHashPin, tokenType }: ImagePreviewProps) => {

    const format = useFormatter();
    const t = useTranslations("images");
    const deleteTranslations = useTranslations("dialogs.images.delete");

    return (
        <ContextMenu key={image.id}>
            <ContextMenuTrigger asChild>
                <button onClick={() => {
                    if (selecting) {
                        if (selected.includes(image.id)) {
                            setSelected(selected.filter((id) => id !== image.id));
                        } else {
                            setSelected([...selected, image.id]);
                        }
                    } else if (onClick) {
                        onClick(image.id);
                    }
                }} style={{ all: "unset", cursor: "pointer" }}>
                    <div className={`inline-block w-64 p-2 rounded-2xl ${selected.includes(image.id) ? "bg-blue-100" : ""}`}>
                        <div className={`relative h-36 mb-4 flex justify-center items-center`}>
                            <Image src={`/api/folders/${image.folderId}/images/${image.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType}`} alt={image.name}
                                className={"relative border border-black rounded-xl object-cover"} sizes="33vw" fill />
                        </div>
                        <p className={"text-start"}>{image.name}</p>
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
                                            <p className={"text-sm opacity-60 capitalize truncate"}>{format.dateTime(image.createdAt, {
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
                </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => {
                    if (onClick) {
                        onClick(image.id);
                    }
                }}>
                    {t('actions.view')}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                    setSelecting(true);
                    setSelected([...selected, image.id])
                }}>
                    {t('actions.select')}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                    if (onDelete) {
                        onDelete(image.id);
                    }
                }} className="text-red-600 focus:text-red-600 font-semibold">
                    {deleteTranslations('trigger')}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
