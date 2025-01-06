"use client";

import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { Images } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useEffect, useState } from "react";
import RenameFolderDialog from "@/components/folders/RenameFolderDialog";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadFolder } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ShareFolderDialog } from "./ShareFolderDialog";
import { FolderWithAccessToken, FolderWithCover, FolderWithImagesCount, ImageWithFolder } from "@/lib/definitions";
import ChangeCoverFolderDialog from "./ChangeCoverFolderDialog";
import { getImagesWithFolderFromFolder } from "@/actions/images";

export default function FolderPreviewClient({ folder, coverB64, locale }: {
    folder: FolderWithAccessToken & FolderWithImagesCount & FolderWithCover,
    coverB64: string,
    locale: string
}) {

    const t = useTranslations("folders");
    const dialogsTranslations = useTranslations("dialogs.folders");
    const format = useFormatter();

    const [openRename, setOpenRename] = useState<boolean>(false);
    const [openChangeCover, setOpenChangeCover] = useState<boolean>(false);
    const [openShare, setOpenShare] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);

    const [folderImages, setFolderImages] = useState<ImageWithFolder[]>([]);

    async function loadImages() {
        setFolderImages((await getImagesWithFolderFromFolder(folder.id)).images);
    }

    useEffect(() => {
        loadImages();
    }, [folder.id]);

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <Link href={`/${locale}/dashboard/folders/${folder.id}`} locale={locale}
                        className={"inline-block w-64"}>
                        {folder.cover
                            ? <div className={`relative h-36 mb-4 flex justify-center items-center`}>
                                <Image src={`/api/folders/${folder.id}/images/${folder.coverId}`} alt={folder.cover.name}
                                    className={"relative border border-black rounded-xl object-cover"} sizes="33vw" fill />
                            </div>
                            : <div
                                className={"border rounded-2xl bg-gray-100 h-36 mb-4 flex justify-center items-center"}>
                                <Images className={"opacity-50"} />
                            </div>
                        }
                        <p className="truncate">{folder.name}</p>
                        <div className={"text-sm flex h-4 items-center flex-nowrap"}>
                            <p className={"opacity-60 text-nowrap"}>{folder._count.images ?? 0} images</p>
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
                    <ContextMenuItem onClick={() => setOpenRename(true)}>{dialogsTranslations('rename.trigger')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenChangeCover(true)} disabled={folderImages.length === 0}>{dialogsTranslations('changeCover.trigger')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenShare(true)}>Share</ContextMenuItem>
                    <ContextMenuItem onClick={async () => {
                        const r = await downloadFolder(folder);

                        if (r === 404) {
                            toast({
                                title: "No images found",
                                description: "There are no images in this folder to download"
                            });
                            return;
                        }

                        if (r !== 200) {
                            toast({
                                title: "Error",
                                description: "An error occurred while trying to download this folder",
                                variant: "destructive"
                            });
                            return;
                        }

                        toast({
                            title: "Download started",
                            description: "Your download will start shortly",
                        });

                    }} disabled={folderImages.length === 0}>{t('actions.download')}</ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenDelete(true)} className="text-red-600 focus:text-red-600 font-semibold">{dialogsTranslations('delete.trigger')}</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <RenameFolderDialog folderId={folder.id} folderName={folder.name} openState={openRename}
                setOpenState={setOpenRename} />
            <ChangeCoverFolderDialog images={folderImages} folderId={folder.id} open={openChangeCover} setOpen={setOpenChangeCover} />
            <ShareFolderDialog folder={folder} open={openShare} setOpen={setOpenShare} />
            <DeleteFolderDialog folderId={folder.id} folderName={folder.name} openState={openDelete}
                setOpenState={setOpenDelete} />
        </>
    )
}
