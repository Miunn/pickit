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
import { useCallback, useEffect, useState } from "react";
import { getFolderFull } from "@/actions/folders";
import { useSearchParams } from "next/navigation";
import * as bcrypt from "bcryptjs";
import { FolderTokenPermission } from "@prisma/client";
import SortImages from "./SortImages";


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
    const [sortState, setSortState] = useState<"name-asc" | "name-desc" | "size-asc" | "size-desc" | "date-asc" | "date-desc">("date-desc");

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

        setPermission(r.permission || "READ");
    }

    useEffect(() => {
        switch (sortState) {
            case "name-asc":
                setFolderContent(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        images: prev.images.sort((a, b) => a.name.localeCompare(b.name))
                    }
                });
                break;
            case "name-desc":
                setFolderContent(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        images: prev.images.sort((a, b) => b.name.localeCompare(a.name))
                    }
                });
                break;
            case "size-asc":
                setFolderContent(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        images: prev.images.sort((a, b) => a.size - b.size)
                    }
                });
                break;
            case "size-desc":
                setFolderContent(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        images: prev.images.sort((a, b) => b.size - a.size)
                    }
                });
                break;
            case "date-asc":
                setFolderContent(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        images: prev.images.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                    }
                });
                break;
            case "date-desc":
                setFolderContent(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        images: prev.images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    }
                });
                break;
        }
    }, [sortState]);

    return (
        <>
            {folderContent
                ? <><div className="flex flex-col">
                    <h3 className={"font-semibold mb-2 flex justify-between"}>
                        {folderContent.name}

                        <div className={"flex gap-4"}>
                            <SortImages sortState={sortState} setSortState={setSortState} />
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
