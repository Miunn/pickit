import { useEffect, useState } from "react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { FileWithComments, FileWithFolder } from "@/lib/definitions";
import Image from "next/image";
import { Button } from "../ui/button";
import { Braces, Check, Copy, Download, Expand, ExternalLink, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn, copyImageToClipboard, downloadClientImageHandler, formatBytes } from "@/lib/utils";
import ImageCommentSection from "./ImageCommentSection";
import { useSearchParams } from "next/navigation";
import ImageExif from "./ImageExif";
import EditDescriptionDialog from "./EditDescriptionDialog";
import { Role, FileType } from "@prisma/client";
import { useSession } from "@/providers/SessionProvider";
import LoadingImage from "../LoadingImage";
import FullScreenImageCarousel from "./FullScrenImageCarousel";

export default function ImagesCarousel({ files, startIndex, currentIndex, setCurrentIndex }: { files: (FileWithFolder & FileWithComments)[], startIndex: number, currentIndex?: number, setCurrentIndex?: React.Dispatch<React.SetStateAction<number>> }) {
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const { user } = useSession();

    const t = useTranslations("components.images.carousel");
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentIndexInternalState, setCurrentIndexInternalState] = useState<number>(currentIndex ?? 0);
    const currentIndexState = currentIndex ?? currentIndexInternalState;
    const setCurrentIndexState = setCurrentIndex ?? setCurrentIndexInternalState;

    const [downloading, setDownloading] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    const [commentSectionOpen, setCommentSectionOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!carouselApi) return;

        setCurrentIndexInternalState(carouselApi.selectedScrollSnap());

        carouselApi.on("select", () => {
            setCurrentIndexInternalState(carouselApi.selectedScrollSnap());
        })
    }, [carouselApi, setCurrentIndexInternalState]);

    return (
        <div className={"w-full overflow-hidden p-2 mx-auto"}>
            <div className="max-w-full flex justify-between items-center mb-2 gap-2 px-2">
                <p className="font-semibold truncate">{files[currentIndexState]?.name}</p>
                <div className="flex gap-2">
                    <FullScreenImageCarousel files={files} defaultIndex={currentIndexState} parentCarouselApi={carouselApi}>
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Expand className="w-4 h-4" />
                        </Button>
                    </FullScreenImageCarousel>
                    <Button variant={"outline"} size={"icon"} type="button" asChild>
                        <Link href={`/api/folders/${files.at(currentIndexState)?.folderId}/images/${files.at(currentIndexState)?.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button variant={"outline"} size={"icon"} type="button" onClick={async () => {
                        setDownloading(true);
                        await downloadClientImageHandler(files.at(currentIndexState) as FileWithFolder);
                        setDownloading(false);
                    }} disabled={downloading}>
                        {downloading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Download className="w-4 h-4" />}
                    </Button>
                    <Button className={files.at(currentIndexState)?.type === FileType.VIDEO ? "hidden" : ""} variant={"outline"} size={"icon"} type="button" onClick={async () => {
                        if (files.at(currentIndexState)?.type === FileType.VIDEO) {
                            toast({
                                title: t('actions.copy.errors.video-copy-unavailable.title'),
                                description: t('actions.copy.errors.video-copy-unavailable.description'),
                                variant: "destructive",
                            });
                            return;
                        }
                        await copyImageToClipboard(files.at(currentIndexState)?.folderId || '', files.at(currentIndexState)?.id || '', shareToken || '', shareHashPin || '', tokenType);

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
                        <ImageExif image={files[currentIndexState]}>
                            <Button variant={"outline"} size={"icon"} type="button">
                                <Braces className="w-4 h-4" />
                            </Button>
                        </ImageExif>
                    </div>
                </div>
            </div>
            <Carousel className="w-full h-fit mx-auto max-w-xl mb-2" opts={{
                align: "center",
                loop: true,
                startIndex: startIndex
            }} setApi={setCarouselApi}>
                <CarouselContent className="h-fit">
                    {files.map((file) => (
                        <CarouselItem key={file.id} className="h-fit">
                            <div className={`${commentSectionOpen ? "h-44" : "h-96"} relative flex justify-center items-center p-2 transition-all duration-300 ease-in-out`}>
                                {file.type === FileType.VIDEO
                                    ? <video className={`${commentSectionOpen ? "h-44" : "h-96"} max-h-96 object-contain rounded-md transition-all duration-300 ease-in-out`} controls src={`/api/folders/${file.folder.id}/videos/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} />
                                    : <LoadingImage src={`/api/folders/${file.folder.id}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                        alt={file.name} className={`${commentSectionOpen ? "h-44" : "h-96"} max-h-96 object-contain rounded-md transition-all duration-300 ease-in-out`} width={900} height={384} spinnerClassName="w-10 h-10 text-primary" />
                                }
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <div className="w-full grid grid-cols-2 items-center px-2">
                <p className="truncate">
                    {files[currentIndexState]?.folder.name}
                </p>
                <p className="text-sm text-muted-foreground text-nowrap text-end justify-self-end">
                    <span className="hidden sm:inline-block">{
                        `${files[currentIndexState]?.width}x${files[currentIndexState]?.height}`
                    }</span> <span className="hidden sm:inline-block">-</span> <span className="hidden sm:inline-block">{
                        `${formatBytes(files[currentIndexState]?.size, { decimals: 2 })}`
                    }</span> <span className="hidden sm:inline-block">-</span> <span>{t('slide', { current: currentIndexState + 1, total: files.length })}</span>
                </p>
            </div>

            <div className="w-full px-2 py-2 flex justify-between items-start gap-4">
                <p className={cn("text-sm text-muted-foreground flex-1 whitespace-pre-wrap line-clamp-5", files[currentIndexState].description ? "" : "italic")}>
                    {files[currentIndexState].description || t('noDescription')}
                </p>

                {user?.role.includes(Role.ADMIN) || user?.id === files[currentIndexState].folder.createdById
                    ? <EditDescriptionDialog file={files[currentIndexState]}>
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Pencil className="w-4 h-4" />
                        </Button>
                    </EditDescriptionDialog>
                    : null}
            </div>

            <ImageCommentSection
                className="py-2 transition-all duration-1000 ease-in-out"
                open={commentSectionOpen}
                setOpen={setCommentSectionOpen}
                file={files[currentIndexState]}
            />
        </div>
    )
}