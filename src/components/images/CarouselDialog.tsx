import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/carousel";
import React, {useEffect, useState} from "react";

export const CarouselDialog = ({images, title, carouselOpen, setCarouselOpen, startIndex}: {
    images: any[],
    title: string,
    carouselOpen: any,
    setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>,
    startIndex: number
}) => {

    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [count, setCount] = useState(images.length);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!carouselApi) return;

        setCount(carouselApi.scrollSnapList().length);
        setCurrent(carouselApi.selectedScrollSnap() + 1);

        carouselApi.on("select", () => {
            setCurrent(carouselApi.selectedScrollSnap() + 1);
        })
    }, [carouselApi]);

    return (
        <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
            <DialogContent className={"w-full max-w-3xl"}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Images</DialogDescription>
                </DialogHeader>

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
                                             alt={image.name} className={"max-h-96 object-cover rounded-md"}/>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious/>
                        <CarouselNext/>
                    </Carousel>
                    <div className="py-2 text-sm flex justify-between items-center">
                        <span>{
                            current == 0
                                ? images[current].name
                                : images[current - 1].name
                        }</span>
                        <span className="text-muted-foreground">Slide {current} of {count}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
