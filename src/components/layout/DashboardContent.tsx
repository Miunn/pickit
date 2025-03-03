'use client'

import { FolderX } from "lucide-react";
import FolderPreview from "@/components/folders/FolderPreview";
import { useTranslations } from "next-intl";
import React from "react";
import { LastUploadedImages } from "@/components/images/LastUploadedImages";
import { FolderWithAccessToken, FolderWithCover, FolderWithImagesCount, ImageWithComments, ImageWithFolder } from "@/lib/definitions";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import CreateFolderDialog from "../folders/CreateFolderDialog";

export default function DashboardContent({ lastFolders, lastImages, locale }: { lastFolders: (FolderWithAccessToken & FolderWithImagesCount & FolderWithCover)[], lastImages: (ImageWithFolder & ImageWithComments)[], locale: string }) {

    const t = useTranslations("pages.dashboard");

    const [openCreateFolder, setOpenCreateFolder] = React.useState(false);

    return (
        <>
        <ContextMenu>
            <ContextMenuTrigger className="flex flex-col flex-grow">
                <h2 className={"font-semibold mb-5"}>{t('folders.lastUpdatedFolders')}</h2>

                <div className={`flex flex-wrap gap-3 ${lastFolders.length == 0 && "justify-center"} mb-10`}>
                    {lastFolders.length == 0
                        ? <div className={"flex flex-col justify-center items-center"}>
                            <FolderX className={"w-32 h-32 opacity-20"} />
                            <p>{t('folders.empty')}</p>
                        </div>
                        : lastFolders.map(folder => (
                            <FolderPreview key={folder.id} folder={folder} locale={locale} />
                        ))
                    }
                </div>

                <LastUploadedImages images={lastImages} locale={locale} />
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => setOpenCreateFolder(true)}>{t('contextMenu.createFolder')}</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
        <CreateFolderDialog open={openCreateFolder} setOpen={setOpenCreateFolder} />
        </>
    )
}
