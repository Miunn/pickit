"use client";

import { Button } from "@/components/ui/button";
import { Download, FolderLock } from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadImagesDialog } from "@/components/images/UploadImagesDialog";
import { ImagesGrid } from "@/components/images/ImagesGrid";
import { downloadFolder } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ShareFolderDialog } from "@/components/folders/ShareFolderDialog";
import { FolderWithAccessToken, FolderWithImagesWithFolder } from "@/lib/definitions";
import UnlockTokenPrompt from "./UnlockTokenPrompt";
import { useCallback, useState } from "react";
import { getFolderFull } from "@/actions/folders";
import { useSearchParams } from "next/navigation";
import * as bcrypt from "bcryptjs";

export const FolderContent = ({ folderId, folder, shareToken, isGuest, locale }: { folderId: string, folder?: (FolderWithImagesWithFolder & FolderWithAccessToken) | null, shareToken?: string, isGuest?: boolean, locale: string }) => {
    const searchParams = useSearchParams();

    const t = useTranslations("folders");
    const [folderContent, setFolderContent] = useState<(FolderWithImagesWithFolder & FolderWithAccessToken) | null | undefined>(folder);
    const [hashPin, setHashPin] = useState<string | undefined>(undefined);
    const [unlockLoading, setUnlockLoading] = useState(false);

    useCallback(() => {
        setFolderContent(folder);
    }, [folder]);

    async function loadFolder(pin?: string) {
        setUnlockLoading(true);
        let hashedPin;
        if (pin) {
            const salt = await bcrypt.genSalt(10)
            hashedPin = await bcrypt.hash(pin, salt);
            setHashPin(hashedPin);
        }
        const r = await getFolderFull(folderId, searchParams.get("share") || undefined, searchParams.get("t") === "p" ? "personAccessToken" : "accessToken", hashedPin);
        setUnlockLoading(false);

        if (r.error === "unauthorized") {
            toast({
                title: "Error",
                description: "Unable to unlock this folder. Code may be incorrect",
                variant: "destructive"
            });
            return;
        }

        if (r.error === "code-needed") {
            toast({
                title: "Error",
                description: "You must provide a code to unlock this folder",
                variant: "destructive"
            });
            return;
        }

        if (r.folder) {
            setFolderContent(r.folder);
        }
    }

    return (
        <>
            {folderContent
                ? <><div className="flex flex-col">
                    <h3 className={"font-semibold mb-2 flex justify-between"}>
                        {folderContent.name}

                        <div className={"flex gap-4"}>
                            <UploadImagesDialog folderId={folderContent.id} />
                            {!!isGuest ? <ShareFolderDialog folder={folderContent} /> : null}
                            <Button variant="outline" onClick={async () => {
                                const r = await downloadFolder(folderContent);

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

                    <ImagesGrid folder={folderContent} shareToken={shareToken} hashPin={hashPin} />
                </div>
                </>
                : <UnlockTokenPrompt unlockLoading={unlockLoading} submit={(data) => loadFolder(data.pin)} />
            }
        </>
    )
}
