'use client'

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadImagesDialog } from "@/components/images/UploadImagesDialog";
import { ImagesGrid } from "@/components/images/ImagesGrid";
import { toast } from "@/hooks/use-toast";
import { ShareFolderDialog } from "@/components/folders/ShareFolderDialog";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImagesWithFolderAndComments } from "@/lib/definitions";
import { useEffect, useState } from "react";
import SortImages, { ImagesSortMethod } from "./SortImages";
import saveAs from "file-saver";
import { Progress } from "../ui/progress";
import { useQueryState } from 'nuqs'

export interface FolderContentProps {
    folder: FolderWithCreatedBy & FolderWithImagesWithFolderAndComments & FolderWithAccessToken;
    isGuest?: boolean;
}



export const FolderContent = ({ folder, isGuest }: FolderContentProps) => {
    const t = useTranslations("folders");
    const [sortState, setSortState] = useQueryState<ImagesSortMethod>('sort', {
        defaultValue: ImagesSortMethod.DateDesc,
        parse: (v) => {
            switch (v) {
                case "name-asc":
                    return ImagesSortMethod.NameAsc;
                case "name-desc":
                    return ImagesSortMethod.NameDesc;
                case "size-asc":
                    return ImagesSortMethod.SizeAsc;
                case "size-desc":
                    return ImagesSortMethod.SizeDesc;
                case "date-asc":
                    return ImagesSortMethod.DateAsc;
                case "date-desc":
                    return ImagesSortMethod.DateDesc;
                default:
                    return ImagesSortMethod.DateDesc;
            }
        }
    });
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [folderContent, setFolderContent] = useState<FolderWithImagesWithFolderAndComments>(folder);

    async function downloadCallback() {
        if (!folder) return;

        toast({
            title: "Download started",
            description: "Your download will start shortly",
            action: <Progress value={downloadProgress} className="mt-2 w-full" />,
            className: "flex-col items-start space-x-0",
        });

        const r = await fetch(`/api/folders/${folder.id}/download`);

        if (r.status === 404) {
            toast({
                title: "No images found",
                description: "There are no images in this folder to download"
            });
            return;
        }

        if (r.status !== 200) {
            toast({
                title: "Error",
                description: "An error occurred while trying to download this folder",
                variant: "destructive"
            });
            return;
        }

        setDownloadProgress(50);

        saveAs(await r.blob(), `${folder.name}.zip`);

        setDownloadProgress(100);
    }

    function getSortedFolderContent(folderContent: FolderWithImagesWithFolderAndComments, sort: ImagesSortMethod): FolderWithImagesWithFolderAndComments {
        switch (sort) {
            case ImagesSortMethod.NameAsc:
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => a.name.localeCompare(b.name))
                }
            case ImagesSortMethod.NameDesc:
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => b.name.localeCompare(a.name))
                }
            case ImagesSortMethod.SizeAsc:
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => a.size - b.size)
                }
            case ImagesSortMethod.SizeDesc:
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => b.size - a.size)
                }
            case ImagesSortMethod.DateAsc:
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                }
            case ImagesSortMethod.DateDesc:
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                }
            default:
                return folderContent;
        }
    }

    useEffect(() => {
        setFolderContent(getSortedFolderContent(folderContent, sortState));
    }, [sortState]);

    useEffect(() => {
        setFolderContent(getSortedFolderContent(folder, sortState));
    }, [folder]);

    return (
        <div>
            <h3 className={"mb-2 flex justify-between items-center"}>
                <p className="font-semibold">{folder.name} {
                    isGuest
                    ? <span className="font-normal text-sm">- Shared by {folder.createdBy.name}</span>
                    : null
                }</p>

                <div className={"flex gap-4"}>
                    <SortImages sortState={sortState} setSortState={setSortState} />
                    {!!!isGuest
                        ? <UploadImagesDialog folderId={folder.id} />
                        : null}
                    {!!!isGuest ? <ShareFolderDialog folder={folder} /> : null}
                    <Button variant="outline" onClick={downloadCallback}>
                        <Download className={"mr-2"} /> {t('actions.download')}
                    </Button>
                </div>
            </h3>

            <div className="flex-1 overflow-auto">
                <ImagesGrid folder={folderContent} />
            </div>
        </div>
    )
}