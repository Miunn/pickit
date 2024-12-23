"use client";

import {Button} from "@/components/ui/button";
import {Download, Settings2} from "lucide-react";
import {useTranslations} from "next-intl";
import {UploadImagesDialog} from "@/components/images/UploadImagesDialog";
import {ImagesGrid} from "@/components/images/ImagesGrid";
import {downloadFolder} from "@/lib/utils";
import {toast} from "@/hooks/use-toast";
import {ShareFolderDialog} from "@/components/folders/ShareFolderDialog";
import { FolderWithAccessToken, FolderWithImages } from "@/lib/definitions";

export const FolderContent = ({folder, locale}: { folder: FolderWithImages & FolderWithAccessToken, locale: string }) => {

    const t = useTranslations("folders");

    return (
        <div className="flex flex-col">
            <div className={"flex gap-4 mb-10"}>
                <UploadImagesDialog folderId={folder.id}/>
                <ShareFolderDialog folder={folder} />
                <Button variant="outline" onClick={() => {
                    toast({
                        title: "Download started",
                        description: "Your download will start shortly",
                    });
                    downloadFolder(folder)
                }}>
                    <Download className={"mr-2"}/> {t('actions.download')}
                </Button>
            </div>

            <h2 className={"font-semibold mb-5"}>{folder.name}</h2>

            <ImagesGrid folder={folder} />
        </div>
    )
}
