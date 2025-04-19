import { FolderWithImagesWithFolderAndComments, VideoWithFolder, VideoWithComments, ImageWithComments, ImageWithFolder } from "@/lib/definitions";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { useTranslations } from "next-intl";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function FullScreenImageCarousel({ 
    files,
    defaultIndex,
    children,
    open, 
    setOpen,
    parentCarouselApi
}: { 
    files: ((ImageWithFolder & ImageWithComments) | (VideoWithFolder & VideoWithComments))[],
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
    const t = useTranslations("dialogs.images.carousel");
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();

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
            <DialogContent className="w-screen h-screen max-w-[90%] max-h-[90%] p-0 border-none bg-transparent" closeButton={<Cross2Icon className="size-7 bg-gray-600 text-white rounded-md p-1" />}>
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
                    <Carousel 
                        className="w-full h-full flex items-center justify-center" 
                        opts={{
                            align: "center",
                            loop: true,
                            skipSnaps: false,
                            startIndex: defaultIndex ?? 0
                        }}
                        setApi={setCarouselApi}
                    >
                        <CarouselContent className="h-full">
                            {files.map((file) => (
                                <CarouselItem key={file.id} className="h-full flex items-center justify-center">
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {file.type === "image" ? (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <Image
                                                    src={`/api/folders/${file.folderId}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                                    alt={file.name}
                                                    className="object-contain max-h-full"
                                                    sizes="100vw"
                                                    quality={100}
                                                    width={file.width}
                                                    height={file.height}
                                                    priority
                                                />
                                            </div>
                                        ) : (
                                            <video 
                                                src={`/api/folders/${file.folderId}/videos/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`} 
                                                className="w-full h-full object-contain" 
                                                autoPlay 
                                                muted 
                                                loop 
                                            />
                                        )}
                                    </div>
                                    </CarouselItem>
                                ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>
            </DialogContent>
        </Dialog>
    );
}
