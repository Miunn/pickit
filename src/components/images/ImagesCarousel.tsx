import { useEffect, useRef, useState } from "react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { ImageWithComments, ImageWithFolder, VideoWithComments, VideoWithFolder } from "@/lib/definitions";
import Image from "next/image";
import { Button } from "../ui/button";
import { Braces, BracesIcon, Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { copyImageToClipboard, formatBytes } from "@/lib/utils";
import ImageCommentSection from "./ImageCommentSection";
import { useSearchParams } from "next/navigation";
import ImageExif from "./ImageExif";

export default function ImagesCarousel({ files, startIndex, currentIndex, setCurrentIndex }: { files: (((ImageWithFolder & ImageWithComments) | (VideoWithFolder & VideoWithComments)) & { type: 'image' | 'video' })[], startIndex: number, currentIndex: number, setCurrentIndex: React.Dispatch<React.SetStateAction<number>> }) {
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const t = useTranslations("components.images.carousel");
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const imagesItemsRefs = files.map(() => useRef<HTMLDivElement>(null));
    const [count, setCount] = useState(files.length);

    const [copied, setCopied] = useState<boolean>(false);

    const [commentSectionOpen, setCommentSectionOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!carouselApi) return;

        setCount(carouselApi.scrollSnapList().length);
        setCurrentIndex(carouselApi.selectedScrollSnap() + 1);

        carouselApi.on("select", () => {
            setCurrentIndex(carouselApi.selectedScrollSnap() + 1);
        })
    }, [carouselApi]);

    return (
        <div className={"p-4 mx-auto"}>
            <div className="flex justify-between items-center mb-2 gap-2 px-2">
                <p className="font-semibold">{
                    currentIndex == 0
                        ? files[currentIndex]?.name
                        : files[currentIndex - 1]?.name
                }</p>
                <div className="flex gap-2">
                    <ImageExif image={files[currentIndex === 0 ? currentIndex : currentIndex - 1]}>
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Braces className="w-4 h-4" />
                        </Button>
                    </ImageExif>
                    <Button variant={"outline"} size={"icon"} type="button" asChild>
                        <Link href={`/api/folders/${files.at(currentIndex - 1)?.folderId}/images/${files.at(currentIndex - 1)?.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button className={files.at(currentIndex - 1)?.type === "video" ? "hidden" : "block"} variant={"outline"} size={"icon"} type="button" onClick={async () => {
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
                </div>
            </div>
            <Carousel className="w-full h-fit mx-auto max-w-xl mb-2" opts={{
                align: "center",
                loop: true,
                startIndex: startIndex
            }} setApi={setCarouselApi}>
                <CarouselContent className="h-fit">
                    {files.map((file, index) => (
                        <CarouselItem ref={imagesItemsRefs[index]} key={file.id} className="h-fit">
                            <div className={`${commentSectionOpen ? "h-44" : "h-96"} flex justify-center items-center p-2 transition-all duration-300 ease-in-out`}>
                                {'type' in file && file.type === 'video'
                                    ? <video className={`${commentSectionOpen ? "h-44" : "h-96"} max-h-96 object-contain rounded-md transition-all duration-300 ease-in-out`} controls src={`/api/folders/${file.folder.id}/videos/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} />
                                    : <Image src={`/api/folders/${file.folder.id}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                        alt={file.name} className={`${commentSectionOpen ? "h-44" : "h-96"} max-h-96 object-contain rounded-md transition-all duration-300 ease-in-out`} width={900} height={384} />
                                }
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <div className="max-w-xl grid grid-cols-2 items-center px-2">
                <p className="truncate">
                    {currentIndex == 0
                        ? files[currentIndex]?.folder.name
                        : files[currentIndex - 1]?.folder.name}
                </p>
                <p className="text-sm text-muted-foreground text-nowrap text-end">
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

            <ImageCommentSection
                className="py-4 transition-all duration-1000 ease-in-out"
                open={commentSectionOpen}
                setOpen={setCommentSectionOpen}
                file={files[currentIndex === 0 ? currentIndex : currentIndex - 1]}
            />
        </div>
    )
}