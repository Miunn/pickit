'use client'

import { useFormatter, useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";
import { FileWithTags, FolderWithTags } from "@/lib/definitions";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { cn, downloadClientImageHandler, formatBytes } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { changeFolderCover } from "@/actions/folders";
import { CirclePlay } from "lucide-react";
import LoadingImage from "@/components/files/LoadingImage";
import { useSession } from "@/providers/SessionProvider";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileType } from "@prisma/client";
import RenameImageDialog from "../../RenameImageDialog";
import { DeleteImageDialog } from "../../DeleteImageDialog";
import ImagePropertiesDialog from "../../ImagePropertiesDialog";
import ManageTagsDialog from "../../ManageTagsDialog";
import { Badge } from "@/components/ui/badge";
import TagChip from "@/components/tags/TagChip";

export interface ImagePreviewProps {
    file: { folder: FolderWithTags } & FileWithTags;
    selected: string[];
    onClick: (e?: React.MouseEvent) => void;
    onSelect: () => void;
    className?: string;
}

export const ImagePreviewGrid = ({ file, selected, onClick, onSelect, className }: ImagePreviewProps) => {
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

    const { user } = useSession();

    const { attributes, listeners, setNodeRef, transition, transform } = useSortable({ id: file.id });

    const style = file.createdById === user?.id && transform ? {
        transform: CSS.Translate.toString(transform),
        transition
    } : undefined;

    // Check if file is less than or equal to 3 days old
    const isNew = React.useMemo(() => {
        const now = new Date();
        const fileDate = new Date(file.createdAt);
        const diffTime = Math.abs(now.getTime() - fileDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
    }, [file.createdAt]);

    return (
        <>
            <ContextMenu key={file.id} modal={false}>
                <ContextMenuTrigger asChild>
                    <button ref={setNodeRef} onClick={onClick} className="w-full unset cursor-pointer" style={style} {...listeners} {...attributes}>
                        <div className={cn(`inline-block w-full rounded-2xl ${selected.includes(file.id) ? "bg-accent" : ""}`, className)}>
                            <div className={`${selected.includes(file.id) ? "scale-95" : ""}`}>
                                <div className={`relative h-32 sm:h-36 mb-4 flex justify-center items-center group`}>
                                    {file.type === FileType.VIDEO
                                        ? <LoadingImage
                                            src={`/api/folders/${file.folderId}/videos/${file.id}/thumbnail?share=${shareToken}&h=${shareHashPin}&t=${tokenType}`}
                                            alt={file.name}
                                            className={"relative border border-primary rounded-xl object-cover"}
                                            spinnerClassName={"text-primary"}
                                            sizes="33vw"
                                            fill
                                        />
                                        : <LoadingImage
                                            src={`/api/folders/${file.folderId}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType}`}
                                            alt={file.name}
                                            className={"relative border border-primary rounded-xl object-cover"}
                                            spinnerClassName={"text-primary"}
                                            sizes="33vw"
                                            fill
                                        />
                                    }
                                    {file.type === FileType.VIDEO
                                        ? <CirclePlay className="absolute left-2 bottom-2 text-white opacity-80 group-hover:opacity-100 transition-all duration-200 ease-in-out" size={25} />
                                        : null
                                    }

                                    {/* New banner overlay */}
                                    {isNew && (
                                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-lg transform rotate-12 z-10">
                                            {t('new')}
                                        </div>
                                    )}

                                    {file.tags.length > 0 && (
                                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                            <TagChip tag={file.tags[0]} />
                                            {file.tags.length > 1 && (
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <TagChip tag={{
                                                                id: "more",
                                                                name: `+${file.tags.length - 1}`,
                                                                color: file.tags[1].color,
                                                                createdAt: new Date(),
                                                                updatedAt: new Date(),
                                                                folderId: file.folderId,
                                                                userId: file.createdById
                                                            }} />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-sm capitalize truncate">
                                                                {file.tags.slice(1).map((tag) => tag.name).join(", ")}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className={"text-start truncate"}>{file.name}</p>
                                <div className={"text-sm h-4 flex items-center justify-between"}>
                                    <div className="h-full flex items-center">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className={"text-sm opacity-60 capitalize truncate"}>{format.dateTime(file.createdAt, {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}</p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className={"text-sm capitalize truncate"}>{format.dateTime(file.createdAt, {
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
                                    <p className="text-muted-foreground text-nowrap">{formatBytes(file.size)}</p>
                                </div>
                            </div>
                        </div>
                    </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={onClick}>
                        {t('actions.view')}
                    </ContextMenuItem>
                    {file.createdById === user?.id
                        ? <ContextMenuItem onClick={onSelect}>
                            {t('actions.select')}
                        </ContextMenuItem>
                        : null
                    }
                    <ContextMenuItem onClick={() => downloadClientImageHandler(file)}>
                        {t('actions.download')}
                    </ContextMenuItem>
                    {file.createdById === user?.id
                        ?
                        <ContextMenuItem onClick={(e) => e.preventDefault()}>
                            <ManageTagsDialog file={file}>
                                <span>
                                    {t('actions.addTag')}
                                </span>
                            </ManageTagsDialog>
                        </ContextMenuItem>
                        : null
                    }
                    {file.createdById === user?.id
                        ? <ContextMenuItem onClick={() => setOpenRename(true)}>
                            {t('actions.rename')}
                        </ContextMenuItem>
                        : null
                    }
                    {file.type === FileType.IMAGE && file.createdById === user?.id
                        ? <ContextMenuItem onClick={async () => {
                            const r = await changeFolderCover(file.folderId, file.id);

                            if (r.error) {
                                toast({
                                    title: t('actions.setAsCover.errors.unknown.title'),
                                    description: t('actions.setAsCover.errors.unknown.description'),
                                    variant: "destructive"
                                });
                                return;
                            }

                            toast({
                                title: t('actions.setAsCover.success.title'),
                                description: t('actions.setAsCover.success.description')
                            });
                        }}>{t('actions.setAsCover.label')}</ContextMenuItem>
                        : null
                    }
                    <ContextMenuItem onClick={() => setOpenProperties(true)}>
                        {t('actions.properties')}
                    </ContextMenuItem>
                    {file.createdById === user?.id
                        ? <>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => setOpenDelete(true)} className="text-red-600 focus:text-red-600 font-semibold">
                                {deleteTranslations('trigger')}
                            </ContextMenuItem>
                        </>
                        : null
                    }
                </ContextMenuContent>
            </ContextMenu >
            <RenameImageDialog file={file} openState={openRename} setOpenState={setOpenRename} />
            <DeleteImageDialog file={file} open={openDelete} setOpen={setOpenDelete} />
            <ImagePropertiesDialog file={file} open={openProperties} setOpen={setOpenProperties} />
        </>
    )
}
