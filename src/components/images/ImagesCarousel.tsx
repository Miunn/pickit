import { useEffect, useState } from "react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { ImageWithFolder } from "@/lib/definitions";

export default function ImagesCarousel({ images, startIndex, currentIndex, setCurrentIndex }: { images: ImageWithFolder[], startIndex: number, currentIndex: number, setCurrentIndex: React.Dispatch<React.SetStateAction<number>> }) {

    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [count, setCount] = useState(images.length);

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
            <Carousel className="w-full max-w-xl h-96" opts={{
                align: "center",
                loop: true,
                startIndex: startIndex
            }} setApi={setCarouselApi}>
                <CarouselContent>
                    {images.map((image) => (
                        <CarouselItem key={image.id} className={"max-h-96"}>
                            <div className={"w-full h-full max-h-96 flex justify-center items-center p-2"}>
                                <img src={`/api/folders/${image.folder.id}/images/${image.id}`}
                                    alt={image.name} className={"max-h-96 object-cover rounded-md"} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <div className="py-2 text-sm flex justify-between items-center">
                <span>{
                    currentIndex == 0
                        ? images[currentIndex]?.name
                        : images[currentIndex - 1]?.name
                }</span>
                <span className="text-muted-foreground">Slide {currentIndex} of {count}</span>
            </div>
        </div>
    )
}