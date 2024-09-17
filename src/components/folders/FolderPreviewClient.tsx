"use client";

import {Separator} from "@/components/ui/separator";
import Link from "next/link";
import {Images} from "lucide-react";
import {useFormatter, useTranslations} from "next-intl";
import fs from "fs";
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger} from "@/components/ui/context-menu";
import {useState} from "react";
import RenameFolderDialog from "@/components/folders/RenameFolderDialog";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

export default function FolderPreviewClient({folder, coverB64, locale}: {
    folder: any,
    coverB64: string,
    locale: string
}) {

    const t = useTranslations("folders.dialog");
    const format = useFormatter();

    const [openRename, setOpenRename] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <Link href={`/${locale}/dashboard/folders/${folder.id}`} locale={locale}
                          className={"inline-block w-64"}>
                        {folder.cover
                            ? <div className={"border rounded-2xl h-32 mb-4 flex justify-center items-center"}>
                                <img src={coverB64} className={"h-28 object-cover rounded-md"} alt={folder.name}/>
                            </div>
                            : <div
                                className={"border rounded-2xl bg-gray-100 h-32 mb-4 flex justify-center items-center"}>
                                <Images className={"opacity-50"}/>
                            </div>
                        }
                        <p>{folder.name}</p>
                        <div className={"text-sm grid h-4 items-center"} style={{
                            gridTemplateColumns: "1fr auto 2fr",
                        }}>
                            <p className={"opacity-60"}>{folder._count?.images ?? 0} images</p>
                            <Separator className="mx-2" orientation="vertical"/>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <p className={"opacity-60 capitalize truncate"}>{format.dateTime(folder.createdAt, {
                                        weekday: "long",
                                        month: "short",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                    })}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className={"opacity-60 capitalize"}>{format.dateTime(folder.createdAt, {
                                            weekday: "long",
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
                            Open
                        </Link>
                    </ContextMenuItem>
                    <ContextMenuItem>Change cover</ContextMenuItem>
                    <ContextMenuItem>Share</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenRename(true)}>{t('rename.trigger')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenDelete(true)}>{t('delete.trigger')}</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <RenameFolderDialog folderId={folder.id} folderName={folder.name} openState={openRename}
                                setOpenState={setOpenRename}/>
            <DeleteFolderDialog folderId={folder.id} folderName={folder.name} openState={openDelete}
                                setOpenState={setOpenDelete}/>
        </>
    )
}
