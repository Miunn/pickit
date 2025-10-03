import React from "react";
import { X } from "lucide-react";
import { FileWithFolder } from "@/lib/definitions";
import LoadingImage from "../files/LoadingImage";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

type ClusterWindowContentProps = {
    file: FileWithFolder & { signedUrl: string };
    onClose: () => void;
};

export const PoiWindowContent = ({ file, onClose }: ClusterWindowContentProps) => {
    const searchParams = useSearchParams();

    return (
        <div className="relative">
            <div className="bg-white border border-primary rounded-lg overflow-hidden shadow-lg mb-[23px] max-w-64">
                <div className="relative h-48 w-full">
                    <LoadingImage src={file.signedUrl} alt={file.name} sizes="33vw" fill className="object-cover" />

                    <button
                        className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1"
                        onClick={() => {
                            onClose();
                        }}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="p-2">
                    <h2 className="w-fit hover:underline text-sm text-gray-500 font-normal flex justify-between items-center gap-2">
                        <Link href={`/app/folders/${file.folderId}?${searchParams.toString()}`}>
                            {file.folder.name}
                        </Link>
                    </h2>
                    <h3 className="text-sm font-bold flex justify-between items-center gap-2">{file.name}</h3>
                </div>
            </div>

            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    bottom: -11,
                    transform: "translateX(-50%)",
                    width: 25,
                    height: 12,
                    pointerEvents: "none", // so it doesn't block clicks
                }}
            >
                <svg width="25" height="13" viewBox="0 1 25 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="0,0 12.5,12 25,0" fill="#fff" stroke="#1f7551" strokeWidth="1" />
                </svg>
            </div>
        </div>
    );
};
