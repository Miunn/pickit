"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadImagesDialog } from "@/components/images/UploadImagesDialog";
import { ImagesGrid } from "@/components/images/ImagesGrid";
import { toast } from "@/hooks/use-toast";
import { ShareFolderDialog } from "@/components/folders/ShareFolderDialog";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImagesWithFolder, FolderWithImagesWithFolderAndComments } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SortImages from "./SortImages";
import saveAs from "file-saver";
import { Progress } from "../ui/progress";

export interface FolderContentProps {
    folder: FolderWithCreatedBy & FolderWithImagesWithFolderAndComments & FolderWithAccessToken;
    isGuest?: boolean;
}

export const FolderContent = ({ folder, isGuest }: FolderContentProps) => {
    const searchParams = useSearchParams();

    const t = useTranslations("folders");
    const [sortState, setSortState] = useState<"name-asc" | "name-desc" | "size-asc" | "size-desc" | "date-asc" | "date-desc" | null>(null);
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

    function getSortedFolderContent(folderContent: FolderWithImagesWithFolderAndComments, sort: "name-asc" | "name-desc" | "size-asc" | "size-desc" | "date-asc" | "date-desc" | null): FolderWithImagesWithFolderAndComments {
        switch (sort) {
            case "name-asc":
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => a.name.localeCompare(b.name))
                }
            case "name-desc":
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => b.name.localeCompare(a.name))
                }
            case "size-asc":
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => a.size - b.size)
                }
            case "size-desc":
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => b.size - a.size)
                }
            case "date-asc":
                return {
                    ...folderContent,
                    images: folderContent.images.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                }
            case "date-desc":
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
                        ? <UploadImagesDialog folderId={folder.id} shareToken={searchParams.get("share")} tokenType={searchParams.get("t") === "p" ? "personAccessToken" : "accessToken"} hashCode={searchParams.get("h") || undefined} />
                        : null}
                    {!!!isGuest ? <ShareFolderDialog folder={folder} /> : null}
                    <Button variant="outline" onClick={downloadCallback}>
                        <Download className={"mr-2"} /> {t('actions.download')}
                    </Button>
                </div>
            </h3>

            <div className="flex-1 overflow-auto">
                <ImagesGrid folder={folderContent} shareToken={searchParams.get("share")} hashPin={searchParams.get("h") || undefined} tokenType={searchParams.get('t') === "p" ? "personAccessToken" : "accessToken"} />
            </div>
        </div>
    )
}
