import { useEffect, useState } from "react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { ImageWithComments, ImageWithFolder, VideoWithComments, VideoWithFolder } from "@/lib/definitions";
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
import { Role } from "@prisma/client";
import { useSession } from "@/providers/SessionProvider";
import LoadingImage from "../LoadingImage";
import FullScreenImageCarousel from "./FullScrenImageCarousel";

export default function ImagesCarousel({ files, startIndex, currentIndex, setCurrentIndex }: { files: ((ImageWithFolder & ImageWithComments) | (VideoWithFolder & VideoWithComments))[], startIndex: number, currentIndex: number, setCurrentIndex: React.Dispatch<React.SetStateAction<number>> }) {
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const { user } = useSession();

    const t = useTranslations("components.images.carousel");
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [count, setCount] = useState(files.length);

    const [downloading, setDownloading] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    const [commentSectionOpen, setCommentSectionOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!carouselApi) return;

        setCount(carouselApi.scrollSnapList().length);
        setCurrentIndex(carouselApi.selectedScrollSnap() + 1);

        carouselApi.on("select", () => {
            setCurrentIndex(carouselApi.selectedScrollSnap() + 1);
        })
    }, [carouselApi, setCurrentIndex]);

    return (
        <div className={"w-full overflow-hidden p-2 mx-auto"}>
            <div className="max-w-full flex justify-between items-center mb-2 gap-2 px-2">
                <p className="font-semibold truncate">{
                    currentIndex == 0
                        ? files[currentIndex]?.name
                        : files[currentIndex - 1]?.name
                }</p>
                <div className="flex gap-2">
                    <FullScreenImageCarousel files={files} defaultIndex={currentIndex - 1}>
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Expand className="w-4 h-4" />
                        </Button>
                    </FullScreenImageCarousel>
                    <Button variant={"outline"} size={"icon"} type="button" asChild>
                        <Link href={`/api/folders/${files.at(currentIndex - 1)?.folderId}/images/${files.at(currentIndex - 1)?.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button variant={"outline"} size={"icon"} type="button" onClick={async () => {
                        setDownloading(true);
                        await downloadClientImageHandler(files.at(currentIndex - 1) as ImageWithFolder | VideoWithFolder);
                        setDownloading(false);
                    }} disabled={downloading}>
                        {downloading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Download className="w-4 h-4" />}
                    </Button>
                    <Button className={files.at(currentIndex - 1)?.type === "video" ? "hidden" : ""} variant={"outline"} size={"icon"} type="button" onClick={async () => {
                        if (files.at(currentIndex - 1)?.type === "video") {
                            toast({
                                title: t('actions.copy.errors.video-copy-unavailable.title'),
                                description: t('actions.copy.errors.video-copy-unavailable.description'),
                                variant: "destructive",
                            });
                            return;
                        }
                        await copyImageToClipboard(files.at(currentIndex - 1)?.folderId || '', files.at(currentIndex - 1)?.id || '', shareToken || '', shareHashPin || '', tokenType);

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
                    <ImageExif image={files[currentIndex === 0 ? currentIndex : currentIndex - 1]}>
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Braces className="w-4 h-4" />
                        </Button>
                    </ImageExif>
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
                            <div className={`${commentSectionOpen ? "h-44" : "h-96"} flex justify-center items-center p-2 transition-all duration-300 ease-in-out`}>
                                {'type' in file && file.type === 'video'
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
                    {currentIndex == 0
                        ? files[currentIndex]?.folder.name
                        : files[currentIndex - 1]?.folder.name}
                </p>
                <p className="text-sm text-muted-foreground text-nowrap text-end justify-self-end">
                    <span>{
                        currentIndex == 0
                            ? `${files[currentIndex]?.width}x${files[currentIndex]?.height}`
                            : `${files[currentIndex - 1]?.width}x${files[currentIndex - 1]?.height}`
                    }</span> - <span>{
                        currentIndex == 0
                            ? `${formatBytes(files[currentIndex]?.size, { decimals: 2 })}`
                            : `${formatBytes(files[currentIndex - 1]?.size, { decimals: 2 })}`
                    }</span> - <span>{t('slide', { current: currentIndex, total: count })}</span>
                </p>
            </div>

            <div className="w-full px-2 py-2 flex justify-between items-start gap-4">
                <p className={cn("text-sm text-muted-foreground flex-1 whitespace-pre-wrap line-clamp-5", files[currentIndex === 0 ? currentIndex : currentIndex - 1].description ? "" : "italic")}>
                    {files[currentIndex === 0 ? currentIndex : currentIndex - 1].description || t('noDescription')}
                </p>

                {user?.role.includes(Role.ADMIN) || user?.id === files[currentIndex === 0 ? currentIndex : currentIndex - 1].folder.createdById
                    ? <EditDescriptionDialog file={files[currentIndex === 0 ? currentIndex : currentIndex - 1]}>
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
                file={files[currentIndex === 0 ? currentIndex : currentIndex - 1]}
            />
        </div>
    )
}