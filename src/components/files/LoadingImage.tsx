import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingImageProps extends ImageProps {
	readonly spinnerClassName?: string;
}

function shouldSkipOptimization(src: ImageProps["src"]): boolean {
	if (typeof src !== "string") {
		return false;
	}
	if (src.startsWith("/api/") || src.startsWith("/media/")) {
		return true;
	}
	try {
		const url = new URL(src);
		return (
			(url.protocol === "https:" || url.protocol === "http:") &&
			(url.hostname === "storage.googleapis.com" || url.hostname.endsWith(".storage.googleapis.com"))
		);
	} catch {
		return false;
	}
}

export default function LoadingImage({ spinnerClassName, alt, src, ...imageProps }: LoadingImageProps) {
	const [isLoading, setIsLoading] = useState(true);
	return (
		<>
			<div
				className={cn(
					"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
					spinnerClassName
				)}
			>
				{isLoading && <Loader2 className={cn(spinnerClassName, "animate-spin")} />}
			</div>
			<Image
				alt={alt}
				src={src}
				unoptimized={shouldSkipOptimization(src)}
				{...imageProps}
				onLoad={() => setIsLoading(false)}
			/>
		</>
	);
}
