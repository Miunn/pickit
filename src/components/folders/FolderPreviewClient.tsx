"use client";

import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Images } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useState } from "react";
import RenameFolderDialog from "@/components/folders/RenameFolderDialog";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadFolder } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ShareFolderDialog } from "./ShareFolderDialog";
import { FolderWithAccessToken, FolderWithCover, FolderWithImagesCount } from "@/lib/definitions";

export default function FolderPreviewClient({ folder, coverB64, locale }: {
    folder: FolderWithAccessToken & FolderWithImagesCount & FolderWithCover,
    coverB64: string,
    locale: string
}) {

    const t = useTranslations("folders");
    const format = useFormatter();

    const [openRename, setOpenRename] = useState<boolean>(false);
    const [openShare, setOpenShare] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <Link href={`/${locale}/dashboard/folders/${folder.id}`} locale={locale}
                        className={"inline-block w-64"}>
                        {folder.cover
                            ? <div className={"border rounded-2xl h-32 mb-4 flex justify-center items-center"}>
                                <img src={coverB64} className={"h-28 object-cover rounded-md"} alt={folder.name} />
                            </div>
                            : <div
                                className={"border rounded-2xl bg-gray-100 h-32 mb-4 flex justify-center items-center"}>
                                <Images className={"opacity-50"} />
                            </div>
                        }
                        <p>{folder.name}</p>
                        <div className={"text-sm grid h-4 items-center"} style={{
                            gridTemplateColumns: "1fr auto 2fr",
                        }}>
                            <p className={"opacity-60"}>{folder._count.images ?? 0} images</p>
                            <Separator className="mx-2" orientation="vertical" />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className={"opacity-60 capitalize truncate"}>{format.dateTime(folder.createdAt, {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className={"opacity-60 capitalize"}>{format.dateTime(folder.createdAt, {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "numeric",
                                            minute: "numeric",
                                        })}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </Link>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem asChild>
                        <Link href={`/${locale}/dashboard/folders/${folder.id}`} locale={locale}>
                            {t('actions.open')}
                        </Link>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenRename(true)}>{t('dialog.rename.trigger')}</ContextMenuItem>
                    <ContextMenuItem>Change cover</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenShare(true)}>Share</ContextMenuItem>
                    <ContextMenuItem onClick={() => {
                        toast({
                            title: "Download started",
                            description: "Your download will start shortly",
                        });
                        downloadFolder(folder)
                    }}>{t('actions.download')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenDelete(true)}>{t('dialog.delete.trigger')}</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <RenameFolderDialog folderId={folder.id} folderName={folder.name} openState={openRename}
                setOpenState={setOpenRename} />
            <ShareFolderDialog folder={folder} open={openShare} setOpen={setOpenShare} />
            <DeleteFolderDialog folderId={folder.id} folderName={folder.name} openState={openDelete}
                setOpenState={setOpenDelete} />
        </>
    )
}
