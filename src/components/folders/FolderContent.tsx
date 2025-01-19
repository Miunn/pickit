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
import { FolderTokenPermission } from "@prisma/client";


export interface FolderContentProps {
    folderId: string;
    folder?: FolderWithImagesWithFolder & FolderWithAccessToken | null;
    isGuest?: boolean;
    locale: string;
}

export const FolderContent = ({ folderId, folder, isGuest, locale }: FolderContentProps) => {
    const searchParams = useSearchParams();

    const t = useTranslations("folders");
    const unlockTranslations = useTranslations("components.accessTokens.unlock");
    const [folderContent, setFolderContent] = useState<(FolderWithImagesWithFolder & FolderWithAccessToken) | null | undefined>(folder);
    const [hashPin, setHashPin] = useState<string | undefined>(undefined);
    const [unlockLoading, setUnlockLoading] = useState(false);
    const [permission, setPermission] = useState<FolderTokenPermission>(isGuest ? "READ" : "WRITE");

    console.log("Is guest", isGuest);

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
                title: unlockTranslations("errors.unauthorized.title"),
                description: unlockTranslations("errors.unauthorized.description"),
                variant: "destructive"
            });
            return;
        }

        if (r.error === "code-needed") {
            toast({
                title: unlockTranslations("errors.codeNeeded.title"),
                description: unlockTranslations("errors.codeNeeded.description"),
                variant: "destructive"
            });
            return;
        }

        if (r.folder) {
            setFolderContent(r.folder);
        }

        console.log("Load permission", r.permission);

        setPermission(r.permission || "READ");
    }

    return (
        <>
            {folderContent
                ? <><div className="flex flex-col">
                    <h3 className={"font-semibold mb-2 flex justify-between"}>
                        {folderContent.name}

                        <div className={"flex gap-4"}>
                            {permission === "WRITE"
                                ? <UploadImagesDialog folderId={folderContent.id} shareToken={searchParams.get("share")} tokenType={searchParams.get("t") === "p" ? "personAccessToken" : "accessToken"} hashCode={hashPin} />
                                : null}
                            {!!!isGuest ? <ShareFolderDialog folder={folderContent} /> : null}
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

                    <ImagesGrid folder={folderContent} shareToken={searchParams.get("share")} hashPin={hashPin} tokenType={searchParams.get('t') === "p" ? "personAccessToken" : "accessToken"} />
                </div>
                </>
                : <UnlockTokenPrompt unlockLoading={unlockLoading} submit={(data) => loadFolder(data.pin)} />
            }
        </>
    )
}
