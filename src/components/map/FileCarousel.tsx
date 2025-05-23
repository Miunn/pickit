import { File } from '@prisma/client';
import { FolderWithFilesCount } from '@/lib/definitions';
import Image from 'next/image';
import { useRef, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type FileWithFolderAndUrl = File & { 
  folder: FolderWithFilesCount;
  signedUrl: string;
};

interface FileCarouselProps {
  files: FileWithFolderAndUrl[];
  startIndex: number;
  onClose: () => void;
}

export default function FileCarousel({ files, startIndex, onClose }: FileCarouselProps) {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3/4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-semibold">Files in this location</h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-300"
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
      >
        <CarouselContent>
          {files.map((file) => (
            <CarouselItem key={file.id} className="basis-1/5">
                <div className="relative w-full h-[200px] border border-primary rounded-lg overflow-hidden shadow-lg">
                  <Image
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