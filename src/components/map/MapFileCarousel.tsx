import { File } from '@prisma/client';
import { FolderWithFilesCount } from '@/lib/definitions';
import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { useMap } from '@vis.gl/react-google-maps';
import LoadingImage from '../files/LoadingImage';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type FileWithFolderAndUrl = File & {
    folder: FolderWithFilesCount;
    signedUrl: string;
};

interface FileCarouselProps {
    files: FileWithFolderAndUrl[];
    startIndex: number;
    onClose: () => void;
    onFileChange?: (file: FileWithFolderAndUrl) => void;
}

export default function MapFileCarousel({ files, startIndex, onClose, onFileChange }: FileCarouselProps) {
    const map = useMap();
    const [api, setApi] = useState<CarouselApi>();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!api) return;

        api.on("select", () => {
            const index = api.selectedScrollSnap();
            const file = files[index];
            if (file && file.latitude && file.longitude) {
                // Pan the map to the new file location
                map?.panTo({ lat: file.latitude, lng: file.longitude });
                // Update POI window data
                onFileChange?.(file);
            }
        });
    }, [api, files, map, onFileChange]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    return (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3/4 z-50">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="w-full"
                    >
                        <Carousel
                            opts={{
                                align: "center",
                                loop: true,
                                startIndex: startIndex,
                            }}
                            className="w-full"
                            setApi={setApi}
                        >
                            <CarouselContent>
                                {files.map((file) => (
                                    <CarouselItem key={file.id} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                                        <div className="relative w-full h-[200px] bg-white border border-primary rounded-lg overflow-hidden shadow-lg">
                                            <LoadingImage
                                                src={file.signedUrl}
                                                alt={file.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                            <button
                                onClick={handleClose}
                                className="absolute h-8 w-8 -right-12 top-0 bg-white hover:bg-gray-100 rounded-full shadow-md flex items-center justify-center"
                            >
                                <X className='size-4' />
                            </button>
                        </Carousel>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 