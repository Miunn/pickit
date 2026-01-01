import { FolderWithFilesCount } from "@/lib/definitions";
import { useFormatter, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Ripple } from "../ui/ripple";
import { Checkbox } from "../ui/checkbox";
import Image from "next/image";
import { FileWarning, Images } from "lucide-react";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";

interface FolderCardProps {
    folder: FolderWithFilesCount;
    ignoredFiles: number;
    isSelected: boolean;
    onToggle: () => void;
    formatter: ReturnType<typeof useFormatter>;
}

export const FolderCard = ({ folder, ignoredFiles, isSelected, onToggle, formatter }: FolderCardProps) => {
    const t = useTranslations("components.map.folderList.folderCard");
    const searchParams = useSearchParams();
    const share = searchParams.get("share");
    const shareType = searchParams.get("t");
    const shareHash = searchParams.get("h");

    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const nextId = useRef(0);

    const addRipple = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = nextId.current++;

        setRipples(prev => [...prev, { id, x, y }]);

        // Remove ripple after animation
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 800);
    };

    return (
        <button
            className={cn(
                "relative inline-block w-64 h-20 bg-background",
                "border border-primary rounded-xl",
                "cursor-pointer overflow-hidden",
                "flex"
            )}
            onClick={e => {
                addRipple(e);
                onToggle();
            }}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {ripples.map(ripple => (
                    <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
                ))}
            </div>
            <div className="absolute top-1 left-1 z-10">
                <Checkbox checked={isSelected} onCheckedChange={onToggle} className="bg-white/90 size-5 rounded-lg" />
            </div>
            {folder.coverId ? (
                <div className={`relative w-20 shrink-0 h-full mb-1 flex justify-center items-center rounded-t-xl`}>
                    <Image
                        src={`/api/folders/${folder.id}/images/${folder.coverId}${share ? `?share=${share}&t=${shareType}&h=${shareHash}` : ""}`}
                        alt={folder.name}
                        className={"relative rounded-t-xl object-cover"}
                        sizes="33vw"
                        fill
                    />
                </div>
            ) : (
                <div
                    className={
                        "rounded-t-xl bg-gray-100 dark:bg-gray-800 w-20 h-full mb-1 flex justify-center items-center shrink-0"
                    }
                >
                    <Images className={"opacity-50 dark:text-gray-400"} />
                </div>
            )}
            <div className="px-2 flex-1 overflow-hidden">
                <p className="truncate">{folder.name}</p>
                <div className={"text-sm flex h-4 items-center flex-nowrap"}>
                    <p className={"opacity-60 text-nowrap truncate"}>
                        {t("folderCount", { count: folder._count.files })}
                    </p>
                    <Separator className="mx-2" orientation="vertical" />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p className={"opacity-60 capitalize truncate"}>
                                    {formatter.dateTime(folder.createdAt, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className={"capitalize"}>
                                    {formatter.dateTime(folder.createdAt, {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                    })}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {ignoredFiles > 0 && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <p className="text-sm font-medium text-yellow-600">
                                    <FileWarning className="inline size-4 mr-1 mb-1" />
                                    {t("ignoredFiles.label", { count: ignoredFiles })}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent className="w-fit max-w-52 text-center">
                                <span>{t("ignoredFiles.description")}</span>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        </button>
    );
};
