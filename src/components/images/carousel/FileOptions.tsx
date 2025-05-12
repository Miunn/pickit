import { Braces } from "lucide-react";

import { Copy } from "lucide-react";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExternalLink, Loader2 } from "lucide-react";
import FullScreenImageCarousel from "./FullScrenImageCarousel";
import { Expand } from "lucide-react";
import Link from "next/link";
import { copyImageToClipboard, downloadClientImageHandler } from "@/lib/utils";
import { FileWithFolder } from "@/lib/definitions";
import { toast } from "@/hooks/use-toast";
import { FileType } from "@prisma/client";
import { useState } from "react";
import ImageExif from "../ImageExif";
import { CarouselApi } from "@/components/ui/carousel";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export default function FileOptions({ file, fullScreenCarouselFiles, currentIndexState, carouselApi }: { file: FileWithFolder, fullScreenCarouselFiles: FileWithFolder[], currentIndexState: number, carouselApi: CarouselApi }) {

    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const t = useTranslations("components.images.carousel");
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    return (
        <div className="flex gap-2">
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
                                title: t('actions.copy.errors.video-copy-unavailable.title'),
                                description: t('actions.copy.errors.video-copy-unavailable.description'),
                                variant: "destructive",
                            });
                            return;
                        }
                        await copyImageToClipboard(file.folderId || '', file.id || '', shareToken || '', shareHashPin || '', tokenType);

                        setCopied(true);
                        toast({
                            title: t('actions.copy.title'),
                            description: t('actions.copy.description'),
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
    )
}