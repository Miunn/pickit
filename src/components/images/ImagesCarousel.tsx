import { useEffect, useRef, useState } from "react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { ImageWithComments, ImageWithFolder } from "@/lib/definitions";
import Image from "next/image";
import { Button } from "../ui/button";
import { Braces, BracesIcon, Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { copyImageToClipboard } from "@/lib/utils";
import ImageCommentSection from "./ImageCommentSection";
import { useSearchParams } from "next/navigation";
import ImageExif from "./ImageExif";

export default function ImagesCarousel({ images, startIndex, currentIndex, setCurrentIndex }: { images: (ImageWithFolder & ImageWithComments)[], startIndex: number, currentIndex: number, setCurrentIndex: React.Dispatch<React.SetStateAction<number>> }) {
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const t = useTranslations("components.images.carousel");
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const imagesItemsRefs = images.map(() => useRef<HTMLDivElement>(null));
    const [count, setCount] = useState(images.length);

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
                        ? images[currentIndex]?.name
                        : images[currentIndex - 1]?.name
                }</p>
                <div className="flex gap-2">
                    <ImageExif image={images[currentIndex === 0 ? currentIndex : currentIndex - 1]}>
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Braces className="w-4 h-4" />
                        </Button>
                    </ImageExif>
                    <Button variant={"outline"} size={"icon"} type="button" asChild>
                        <Link href={`/api/folders/${images.at(currentIndex - 1)?.folderId}/images/${images.at(currentIndex - 1)?.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button variant={"outline"} size={"icon"} type="button" onClick={async () => {
                        await copyImageToClipboard(images.at(currentIndex - 1)?.folderId || '', images.at(currentIndex - 1)?.id || '', shareToken || '', shareHashPin || '', tokenType);

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
                    {images.map((image, index) => (
                        <CarouselItem ref={imagesItemsRefs[index]} key={image.id} className="h-fit">
                            <div className={`${commentSectionOpen ? "h-44" : "h-96"} flex justify-center items-center p-2 transition-all duration-300 ease-in-out`}>
                                <Image src={`/api/folders/${image.folder.id}/images/${image.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                    alt={image.name} className={`${commentSectionOpen ? "h-44" : "h-96"} max-h-96 object-contain rounded-md transition-all duration-300 ease-in-out`} width={900} height={384} />
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
                        ? images[currentIndex]?.folder.name
                        : images[currentIndex - 1]?.folder.name}
                </p>
                <p className="text-sm text-muted-foreground text-nowrap text-end">
                    <span>{
                        currentIndex == 0
                            ? `${images[currentIndex]?.width}x${images[currentIndex]?.height}`
                            : `${images[currentIndex - 1]?.width}x${images[currentIndex - 1]?.height}`
                    }</span> - <span>{t('slide', { current: currentIndex, total: count })}</span>
                </p>
            </div>

            <ImageCommentSection
                className="py-4 transition-all duration-1000 ease-in-out"
                open={commentSectionOpen}
                setOpen={setCommentSectionOpen}
                image={images[currentIndex === 0 ? currentIndex : currentIndex - 1]}
            />
        </div>
    )
}