import { useEffect, useRef, useState } from "react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { ImageWithFolder } from "@/lib/definitions";
import Image from "next/image";
import { Button } from "../ui/button";
import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function ImagesCarousel({ images, startIndex, currentIndex, setCurrentIndex }: { images: ImageWithFolder[], startIndex: number, currentIndex: number, setCurrentIndex: React.Dispatch<React.SetStateAction<number>> }) {

    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const imagesItemsRefs = images.map(() => useRef<HTMLDivElement>(null));
    const [count, setCount] = useState(images.length);

    const [copied, setCopied] = useState<boolean>(false);

    const copyImageToClipboard = async () => {
        let image = await (await fetch(`/api/folders/${images.at(currentIndex - 1)?.folderId}/images/${images.at(currentIndex - 1)?.id}`)).blob();
        image = image.slice(0, image.size, "image/png")

        navigator.clipboard.write([
            new ClipboardItem({
                [image.type]: image
            })
        ]);

        setCopied(true);
        toast({
            title: "Image copied",
            description: "Image has been copied to your clipboard",
            duration: 2000
        });

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }

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
                    <Button variant={"outline"} size={"icon"} type="button" asChild>
                        <Link href={`/_next/image?url=/api/folders/${images.at(currentIndex - 1)?.folderId}/images/${images.at(currentIndex - 1)?.id}&w=3840&q=100`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button variant={"outline"} size={"icon"} type="button" onClick={copyImageToClipboard}>
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
                            <div className={"h-96 flex justify-center items-center p-2"}>
                                <Image src={`/api/folders/${image.folder.id}/images/${image.id}`}
                                    alt={image.name} className={"h-96 max-h-96 object-contain rounded-md"} width={900} height={384} />
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
                    }</span> - <span>Slide {currentIndex} of {count}</span>
                </p>
            </div>
        </div>
    )
}