import { FileWithFolder } from "@/lib/definitions";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../ui/carousel";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "../../ui/dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import LoadingImage from "../LoadingImage";
import { FileType } from "@prisma/client";
export default function FullScreenImageCarousel({ 
    files,
    defaultIndex,
    children,
    open, 
    setOpen,
    parentCarouselApi
}: { 
    files: FileWithFolder[],
    defaultIndex: number,
    children?: React.ReactNode,
    open?: boolean,
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>,
    parentCarouselApi?: CarouselApi
}) {
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [showLeftNav, setShowLeftNav] = useState(false);
    const [showRightNav, setShowRightNav] = useState(false);

    // Simple one-way sync from parent to fullscreen
    useEffect(() => {
        if (!carouselApi || !parentCarouselApi) return;
        
        const handleParentSelect = () => {
            const selectedIndex = parentCarouselApi.selectedScrollSnap();
            carouselApi.scrollTo(selectedIndex);
        };
        
        parentCarouselApi.on("select", handleParentSelect);
        
        return () => {
            parentCarouselApi.off("select", handleParentSelect);
        };
    }, [carouselApi, parentCarouselApi]);

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (setOpen) {
                setOpen(open);
            }

            if (!open) {
                console.log("closing, syncing parent", carouselApi?.selectedScrollSnap());
                parentCarouselApi?.scrollTo(carouselApi?.selectedScrollSnap() ?? 0);
            }
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="w-dvw h-dvh max-w-none max-h-none p-0 border-none bg-transparent overflow-hidden" closeButton={<Cross2Icon className="size-7 bg-gray-600 text-white rounded-md p-1" />}>
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
                    <Carousel className="w-full h-full" opts={{
                        align: "center",
                        loop: true,
                        startIndex: defaultIndex ?? 0
                    }} setApi={setCarouselApi}>
                        <CarouselContent className="h-full">
                            {files.map((file) => (
                                <CarouselItem key={file.id} className="h-full">
                                    <div className="relative h-full w-full flex justify-center items-center p-2">
                                        {file.type === FileType.VIDEO
                                            ? <video className="h-full w-full max-h-dvh object-contain" controls src={`/api/folders/${file.folder.id}/videos/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} />
                                            : <LoadingImage src={`/api/folders/${file.folder.id}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                                alt={file.name} className="h-full w-full max-h-dvh object-contain" width={1920} height={1080} spinnerClassName="w-10 h-10 text-primary" />
                                        }
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                            <div 
                                className="pointer-events-auto w-1/5 md:w-1/4 h-full flex items-center justify-start pl-10 md:pl-14"
                                onMouseEnter={() => setShowLeftNav(true)}
                                onMouseLeave={() => setShowLeftNav(false)}
                            >
                                <div className={`flex items-center justify-center transition-opacity duration-300 ${showLeftNav ? 'opacity-100' : 'opacity-0'}`}>
                                    <CarouselPrevious className="relative left-0 translate-x-0 w-10 h-10 md:h-12 md:w-12" />
                                </div>
                            </div>
                            <div 
                                className="pointer-events-auto w-1/5 md:w-1/4 h-full flex items-center justify-end pr-10 md:pr-14"
                                onMouseEnter={() => setShowRightNav(true)}
                                onMouseLeave={() => setShowRightNav(false)}
                            >
                                <div className={`flex items-center justify-center transition-opacity duration-300 ${showRightNav ? 'opacity-100' : 'opacity-0'}`}>
                                    <CarouselNext className="relative right-0 translate-x-0 w-10 h-10 md:h-12 md:w-12" />
                                </div>
                            </div>
                        </div>
                    </Carousel>
                </div>
            </DialogContent>
        </Dialog>
    );
}
