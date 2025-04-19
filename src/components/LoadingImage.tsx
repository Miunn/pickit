import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingImageProps extends ImageProps {
    spinnerClassName?: string;
}

export default function LoadingImage({ spinnerClassName, ...imageProps }: LoadingImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    return (
        <>
            <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", spinnerClassName)}>
                {isLoading && <Loader2 className={cn(spinnerClassName, "animate-spin")} />}
            </div>
            <Image
                {...imageProps}
                onLoad={() => setIsLoading(false)}
            />
        </>
    )
}
