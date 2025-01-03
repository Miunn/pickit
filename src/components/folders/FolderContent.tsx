"use client";

import { Button } from "@/components/ui/button";
import { Download, FolderLock } from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadImagesDialog } from "@/components/images/UploadImagesDialog";
import { ImagesGrid } from "@/components/images/ImagesGrid";
import { downloadFolder } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ShareFolderDialog } from "@/components/folders/ShareFolderDialog";
import { FolderWithAccessToken, FolderWithImagesWithFolder, FolderWithLocked } from "@/lib/definitions";
import LockFolderDialog from "./LockFolderDialog";
import { DialogTrigger } from "../ui/dialog";

export const FolderContent = ({ folder, locale }: { folder: FolderWithImagesWithFolder & FolderWithAccessToken & FolderWithLocked, locale: string }) => {

    const t = useTranslations("folders");

    return (
        <div className="flex flex-col">
            <h3 className={"font-semibold mb-2 flex justify-between"}>
                {folder.name}

                <div className={"flex gap-4"}>
                    <UploadImagesDialog folderId={folder.id} />
                    <LockFolderDialog folderId={folder.id}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><FolderLock className="mr-2" /> Lock folder</Button>
                        </DialogTrigger>
                    </LockFolderDialog>
                    <ShareFolderDialog folder={folder} />
                    <Button variant="outline" onClick={async () => {
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
                    }}>
                        <Download className={"mr-2"} /> {t('actions.download')}
                    </Button>
                </div>
            </h3>

            <ImagesGrid folder={folder} />
        </div>
    )
}
