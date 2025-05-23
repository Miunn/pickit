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

export default function FileCarousel({ files, startIndex, onClose, onFileChange }: FileCarouselProps) {
  const map = useMap();
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      const index = api.selectedScrollSnap();
      const file = files[(index + 2) % files.length];
      if (file && file.latitude && file.longitude) {
        // Pan the map to the new file location
        map?.panTo({ lat: file.latitude, lng: file.longitude });
        // Update POI window data
        onFileChange?.(file);
      }
    });
  }, [api, files, map, onFileChange]);

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3/4 z-50">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={onClose}
          className="text-primary"
        >
          ✕
        </button>
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: true,
          startIndex: (startIndex - 2) % files.length,
        }}
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent>
          {files.map((file) => (
            <CarouselItem key={file.id} className="basis-1/5">
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
      </Carousel>
    </div>
  );
} 