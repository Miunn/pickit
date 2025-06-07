import { Braces, Ellipsis, Tags } from "lucide-react";

import { Copy } from "lucide-react";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExternalLink, Loader2 } from "lucide-react";
import FullScreenImageCarousel from "./FullScrenImageCarousel";
import { Expand } from "lucide-react";
import Link from "next/link";
import { copyImageToClipboard, downloadClientImageHandler } from "@/lib/utils";
import { FileWithFolder, FileWithTags, FolderWithTags } from "@/lib/definitions";
import { toast } from "@/hooks/use-toast";
import { FileType } from "@prisma/client";
import { useState } from "react";
import ImageExif from "../ImageExif";
import { CarouselApi } from "@/components/ui/carousel";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ManageTagsDialog from "../ManageTagsDialog";
import { useSession } from "@/providers/SessionProvider";

export default function FileOptions({ file, fullScreenCarouselFiles, currentIndexState, carouselApi }: { file: { folder: FolderWithTags } & FileWithTags, fullScreenCarouselFiles: (FileWithFolder & FileWithTags)[], currentIndexState: number, carouselApi: CarouselApi }) {
    const { user } = useSession();
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const t = useTranslations("components.images.carousel.actions");
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    return (
        <>
            <div className="hidden sm:flex gap-2">
                {user?.id === file.createdById && (
                    <ManageTagsDialog file={file}>
                    <Button variant={"outline"} size={"icon"} type="button">
                        <Tags className="w-4 h-4" />
                    </Button>
                </ManageTagsDialog>
                )}
                <FullScreenImageCarousel files={fullScreenCarouselFiles} defaultIndex={currentIndexState} parentCarouselApi={carouselApi}>
                    <Button variant={"outline"} size={"icon"} type="button">
                        <Expand className="w-4 h-4" />
                    </Button>
                </FullScreenImageCarousel>
                <Button variant={"outline"} size={"icon"} type="button" asChild>
                    <Link href={`/api/folders/${file.folderId}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                </Button>
                <Button variant={"outline"} size={"icon"} type="button" onClick={async () => {
                    setDownloading(true);
                    await downloadClientImageHandler(file);
                    setDownloading(false);
                }} disabled={downloading}>
                    {downloading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4" />}
                </Button>
                <Button className={file.type === FileType.VIDEO ? "hidden" : ""} variant={"outline"} size={"icon"} type="button" onClick={async () => {
                    if (file.type === FileType.VIDEO) {
                        toast({
                            title: t('copy.errors.video-copy-unavailable.title'),
                            description: t('copy.errors.video-copy-unavailable.description'),
                            variant: "destructive",
                        });
                        return;
                    }
                    await copyImageToClipboard(file.folderId || '', file.id || '', shareToken || '', shareHashPin || '', tokenType);

                    setCopied(true);
                    toast({
                        title: t('copy.success.title'),
                        description: t('copy.success.description'),
                        duration: 2000
                    });

                    setTimeout(() => {
                        setCopied(false);
                    }, 2000);
                }}>
                    {copied
                        ? <Check className="w-4 h-4" />
                        : <Copy className="w-4 h-4" />}
                </Button>
                <div className="hidden sm:block">
                    <ImageExif image={file}>
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Braces className="w-4 h-4" />
                        </Button>
                    </ImageExif>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger className="sm:hidden" asChild>
                    <Button variant="outline" size="icon">
                        <Ellipsis className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {user?.id === file.createdById && (
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <ManageTagsDialog file={file}>
                                <div className="w-full flex items-center">
                                    <Tags size={16} className="opacity-60 mr-2" aria-hidden="true" />
                                    {t('manageTags')}
                                </div>
                            </ManageTagsDialog>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <div onClick={(e) => e.stopPropagation()} className="w-full flex items-center">
                            <FullScreenImageCarousel files={fullScreenCarouselFiles} defaultIndex={currentIndexState} parentCarouselApi={carouselApi}>
                                <div className="w-full flex items-center">
                                    <Expand size={16} className="opacity-60 mr-2" aria-hidden="true" />
                                    {t('expand')}
                                </div>
                            </FullScreenImageCarousel>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/api/folders/${file.folderId}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} target="_blank">
                            <ExternalLink size={16} className="opacity-60 mr-2" aria-hidden="true" />
                            {t('openInNew')}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                        setDownloading(true);
                        await downloadClientImageHandler(file);
                        setDownloading(false);
                    }} disabled={downloading}>
                        {downloading
                            ? <Loader2 size={16} className="opacity-60 animate-spin mr-2" aria-hidden="true" />
                            : <Download size={16} className="opacity-60 mr-2" aria-hidden="true" />}
                        {t('download')}
                    </DropdownMenuItem>
                    {file.type !== FileType.VIDEO
                        ? <DropdownMenuItem onClick={async (e) => {
                            if (file.type === FileType.VIDEO) {
                                toast({
                                    title: t('copy.errors.video-copy-unavailable.title'),
                                    description: t('copy.errors.video-copy-unavailable.description'),
                                    variant: "destructive",
                                });
                                return;
                            }
                            await copyImageToClipboard(file.folderId || '', file.id || '', shareToken || '', shareHashPin || '', tokenType);

                            setCopied(true);
                            toast({
                                title: t('copy.success.title'),
                                description: t('copy.success.description'),
                                duration: 2000
                            });

                            setTimeout(() => {
                                setCopied(false);
                            }, 2000);
                        }}>
                            {copied
                                ? <Check size={16} className="opacity-60 mr-2" aria-hidden="true" />
                                : <Copy size={16} className="opacity-60 mr-2" aria-hidden="true" />}
                            {t('copy.title')}
                        </DropdownMenuItem>
                        : null}
                    <DropdownMenuItem>
                        <div onClick={(e) => e.stopPropagation()} className="w-full flex items-center">
                            <ImageExif image={file}>
                                <div className="w-full flex items-center">
                                    <Braces size={16} className="opacity-60 mr-2" aria-hidden="true" />
                                    {t('metadata')}
                                </div>
                            </ImageExif>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}