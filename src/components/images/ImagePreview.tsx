import { Separator } from "@/components/ui/separator";
import { useFormatter, useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";
import Image from "next/image";
import { ImageWithFolder } from "@/lib/definitions";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";

export interface ImagePreviewProps {
    image: ImageWithFolder;
    withFolder: boolean;
    selecting: boolean;
    setSelecting: React.Dispatch<React.SetStateAction<boolean>>;
    selected: string[];
    setSelected: React.Dispatch<React.SetStateAction<string[]>>;
    onClick?: (imageId: string) => void;
    onDelete?: (imageId: string) => void;
}

export const ImagePreview = ({ image, withFolder, selecting, setSelecting, selected, setSelected, onClick, onDelete }: ImagePreviewProps) => {

    const format = useFormatter();
    const t = useTranslations("images");

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
                        <div className={`border rounded-xl h-32 mb-4 flex justify-center items-center`}>
                            <Image src={`/api/folders/${image.folderId}/images/${image.id}`} alt={image.name}
                                className={"h-28 object-contain rounded-lg"} width={256} height={112} />
                        </div>
                        <p className={"text-start"}>{image.name}</p>
                        <div className={"text-sm h-4 flex items-center"}>
                            {(withFolder ?? false)
                                ? <>
                                    <p className={"opacity-60"}>{image.folder.name}</p>
                                    <Separator className="mx-2" orientation="vertical" />
                                </>
                                : null
                            }
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
                    {t('actions.delete')}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
