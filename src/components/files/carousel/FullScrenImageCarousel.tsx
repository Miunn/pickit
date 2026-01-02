import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../../ui/carousel";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import LoadingImage from "../LoadingImage";
import { FileType } from "@prisma/client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useFilesContext } from "@/context/FilesContext";

export default function FullScreenImageCarousel({
    defaultIndex,
    children,
    open,
    setOpen,
    parentCarouselApi,
}: {
    readonly defaultIndex: number;
    readonly children?: React.ReactNode;
    readonly open?: boolean;
    readonly setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    readonly parentCarouselApi?: CarouselApi;
}) {
    const { sortedFiles } = useFilesContext();
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [autoPlay, setAutoPlay] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [currentFile, setCurrentFile] = useState<(typeof sortedFiles)[number] | null>(null);

    useEffect(() => {
        if (!carouselApi) return;
        setCurrentFile(sortedFiles[carouselApi.selectedScrollSnap()]);

        const handleSelect = () => {
            setCurrentFile(sortedFiles[carouselApi.selectedScrollSnap()]);
        };

        carouselApi.on("select", handleSelect);

        return () => {
            carouselApi.off("select", handleSelect);
        };
    }, [carouselApi, sortedFiles]);

    // Auto-advance effect
    useEffect(() => {
        if (!carouselApi) return;
        if (!autoPlay) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Start interval
        intervalRef.current = setInterval(() => {
            // Advance by one slide every 10s
            try {
                carouselApi.scrollNext();
            } catch {}
        }, 10000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [autoPlay, carouselApi]);

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
        <Dialog
            open={open}
            onOpenChange={open => {
                if (setOpen) {
                    setOpen(open);
                }

                if (!open) {
                    parentCarouselApi?.scrollTo(carouselApi?.selectedScrollSnap() ?? 0);
                }
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="w-dvw h-dvh max-w-none max-h-none p-0 border-none bg-transparent overflow-hidden"
                closeButton={<Cross2Icon className="size-7 bg-gray-600 text-white rounded-md p-1" />}
            >
                <VisuallyHidden>
                    <DialogTitle>{currentFile?.name}</DialogTitle>
                </VisuallyHidden>
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
                    <Carousel
                        className="w-full h-full"
                        opts={{
                            align: "center",
                            loop: true,
                            startIndex: defaultIndex ?? 0,
                            inViewThreshold: 0.1,
                        }}
                        setApi={setCarouselApi}
                    >
                        <CarouselContent className="h-full">
                            {sortedFiles.map(file => (
                                <CarouselItem key={file.id} className="h-full">
                                    <div className="relative h-full w-full flex justify-center items-center p-2">
                                        {file.type === FileType.VIDEO ? (
                                            <video
                                                className="h-full w-full max-h-dvh object-contain"
                                                controls
                                                src={`/api/folders/${file.folder.id}/videos/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                            >
                                                <track kind="captions" />
                                            </video>
                                        ) : (
                                            <LoadingImage
                                                src={`/api/folders/${file.folder.id}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                                alt={file.name}
                                                className="h-full w-full max-h-dvh object-contain"
                                                width={1920}
                                                height={1080}
                                                spinnerClassName="w-10 h-10 text-primary"
                                            />
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {/* Top controls overlay (visible on hover over top area) */}
                        <div className="group absolute top-0 left-0 right-0 h-16 pointer-events-auto">
                            <div
                                className={cn(
                                    "absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 text-white rounded-full px-3 py-1 transition-opacity duration-300",
                                    "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                )}
                            >
                                <span className="text-xs">Auto-play</span>
                                <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
                                <span className="text-xs">10s</span>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                            <div className="group pointer-events-auto w-1/5 md:w-1/4 h-full flex items-center justify-start pl-10 md:pl-14">
                                <div
                                    className={cn(
                                        "flex items-center justify-center transition-opacity duration-300",
                                        "opacity-0 group-hover:opacity-100"
                                    )}
                                >
                                    <CarouselPrevious className="relative left-0 translate-x-0 w-10 h-10 md:h-12 md:w-12" />
                                </div>
                            </div>
                            <div className="group pointer-events-auto w-1/5 md:w-1/4 h-full flex items-center justify-end pr-10 md:pr-14">
                                <div
                                    className={cn(
                                        "flex items-center justify-center transition-opacity duration-300",
                                        "opacity-0 group-hover:opacity-100"
                                    )}
                                >
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
