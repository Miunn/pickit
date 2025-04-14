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
            {isLoading && <Loader2 className={cn(spinnerClassName, "animate-spin")} />}
            <Image
                {...imageProps}
                onLoadingComplete={() => setIsLoading(false)}
            />
        </>
    )
}
