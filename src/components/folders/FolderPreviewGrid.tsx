'use client'

import { FolderWithAccessToken, FolderWithCover, FolderWithFilesCount, FileWithComments, FileWithFolder, FolderWithFilesWithFolderAndComments, FolderWithFiles } from "@/lib/definitions";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import React from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "../ui/context-menu";
import Link from "next/link";
import Image from "next/image";
import { Images } from "lucide-react";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import RenameFolderDialog from "./RenameFolderDialog";
import ChangeCoverFolderDialog from "./ChangeCoverFolderDialog";
import { ShareFolderDialog } from "./ShareFolderDialog";
import FolderPropertiesDialog from "./FolderPropertiesDialogs";
import DeleteFolderDialog from "./DeleteFolderDialog";
import { downloadClientFolder } from "@/lib/utils";
import { FileType } from "@prisma/client";

export default function FolderPreviewGrid({ folder }: { folder: FolderWithAccessToken & FolderWithFilesCount & FolderWithCover & FolderWithFilesWithFolderAndComments }) {
    const t = useTranslations("folders");
    const dialogsTranslations = useTranslations("dialogs.folders");
    const downloadT = useTranslations("folders.download");
    const format = useFormatter();
    const locale = useLocale();

    const [openRename, setOpenRename] = React.useState<boolean>(false);
    const [openChangeCover, setOpenChangeCover] = React.useState<boolean>(false);
    const [openShare, setOpenShare] = React.useState<boolean>(false);
    const [openProperties, setOpenProperties] = React.useState<boolean>(false);
    const [openDelete, setOpenDelete] = React.useState<boolean>(false);

    return (
        <>
            <ContextMenu modal={false}>
                <ContextMenuTrigger asChild>
                    <Link href={`/${locale}/app/folders/${folder.id}`} locale={locale}
                        className={"inline-block w-64"}>
                        {folder.cover
                            ? <div className={`relative h-36 mb-4 flex justify-center items-center border border-primary rounded-xl`}>
                                <Image src={`/api/folders/${folder.id}/images/${folder.coverId}`} alt={folder.cover.name}
                                    className={"relative rounded-xl object-cover"} sizes="33vw" fill />
                            </div>
                            : <div
                                className={"border border-primary rounded-2xl bg-gray-100 dark:bg-gray-800 h-36 mb-4 flex justify-center items-center"}>
                                <Images className={"opacity-50 dark:text-gray-400"} />
                            </div>
                        }
                        <p className="truncate">{folder.name}</p>
                        <div className={"text-sm flex h-4 items-center flex-nowrap"}>
                            <p className={"opacity-60 text-nowrap"}>{t('filesCount', {count: folder._count.files})}</p>
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
                                        <p className={"capitalize"}>{format.dateTime(folder.createdAt, {
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
                        <Link href={`/${locale}/app/folders/${folder.id}`} locale={locale}>
                            {t('actions.open')}
                        </Link>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenRename(true)}>{dialogsTranslations('rename.trigger')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenChangeCover(true)} disabled={folder.files.length === 0}>{dialogsTranslations('changeCover.trigger')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenShare(true)}>{dialogsTranslations('share.trigger')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => downloadClientFolder(folder, downloadT)} disabled={folder.files.length === 0}>{t('actions.download')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenProperties(true)}>{t('actions.properties')}</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setOpenDelete(true)} className="text-red-600 focus:text-red-600 font-semibold">{dialogsTranslations('delete.trigger')}</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <RenameFolderDialog folderId={folder.id} folderName={folder.name} openState={openRename}
                setOpenState={setOpenRename} />
            <ChangeCoverFolderDialog images={folder.files.filter((file) => file.type === FileType.IMAGE)} folderId={folder.id} open={openChangeCover} setOpen={setOpenChangeCover} />
            <ShareFolderDialog folder={folder} open={openShare} setOpen={setOpenShare} />
            <FolderPropertiesDialog folder={folder} open={openProperties} setOpen={setOpenProperties} />
            <DeleteFolderDialog folderId={folder.id} folderName={folder.name} openState={openDelete}
                setOpenState={setOpenDelete} />
        </>
    )
}
