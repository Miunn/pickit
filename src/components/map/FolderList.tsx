import { Folder } from "@prisma/client";
import { Images } from "lucide-react";
import Image from "next/image";
import { TooltipContent, TooltipProvider } from "../ui/tooltip";
import { TooltipTrigger } from "../ui/tooltip";
import { Tooltip } from "../ui/tooltip";
import { Separator } from "../ui/separator";
import { useFormatter, useTranslations } from "next-intl";
import { Checkbox } from "../ui/checkbox";
import { useState, useRef } from "react";
import { FolderWithFilesCount } from "@/lib/definitions";
import { useSearchParams } from "next/navigation";

const Ripple = ({ x, y }: { x: number; y: number }) => {
    return (
        <span
            className="absolute block rounded-full animate-ripple duration-500"
            style={{
                left: x,
                top: y,
                backgroundColor: "hsl(var(--primary) / 0.3)",
                transform: "translate(-50%, -50%)",
                width: "200px",
                height: "200px",
                zIndex: 100
            }}
        />
    );
};

interface FolderCardProps {
    folder: FolderWithFilesCount;
    isSelected: boolean;
    onToggle: () => void;
    formatter: any;
}

const FolderCard = ({ folder, isSelected, onToggle, formatter }: FolderCardProps) => {
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
        <div 
            className={`inline-block w-64 bg-white border border-primary rounded-xl relative cursor-pointer hover:border-primary/80 transition-colors overflow-hidden`} 
            onClick={(e) => {
                addRipple(e);
                onToggle();
            }}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {ripples.map(ripple => (
                    <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
                ))}
            </div>
            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                    checked={isSelected}
                    onCheckedChange={onToggle}
                    className="bg-white/90 size-6"
                />
            </div>
            {folder.coverId
                ? <div className={`relative h-36 mb-1 flex justify-center items-center rounded-t-xl`}>
                    <Image src={`/api/folders/${folder.id}/images/${folder.coverId}${share ? `?share=${share}&t=${shareType}&h=${shareHash}` : ""}`} alt={folder.name}
                        className={"relative rounded-t-xl object-cover"} sizes="33vw" fill />
                </div>
                : <div
                    className={"rounded-t-xl bg-gray-100 dark:bg-gray-800 h-36 mb-1 flex justify-center items-center"}>
                    <Images className={"opacity-50 dark:text-gray-400"} />
                </div>
            }
            <p className="truncate px-2">{folder.name}</p>
            <div className={"text-sm flex h-4 items-center flex-nowrap px-2 mb-2"}>
                <p className={"opacity-60 text-nowrap"}>{t("folderCount", { count: folder._count.files })}</p>
                <Separator className="mx-2" orientation="vertical" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className={"opacity-60 capitalize truncate"}>{formatter.dateTime(folder.createdAt, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}</p>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className={"capitalize"}>{formatter.dateTime(folder.createdAt, {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                            })}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};

export default function FolderList({ folders, onSelectionChange }: { folders: FolderWithFilesCount[], onSelectionChange: (selectedFolders: Set<string>) => void }) {
    const formatter = useFormatter();
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set(folders.map(folder => folder.id)));

    const toggleFolderSelection = (folderId: string) => {
        setSelectedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            onSelectionChange(newSet);
            return newSet;
        });
    };

    return (
        <>
        <div className="hidden md:flex flex-col gap-2">
            {folders.map((folder) => (
                <FolderCard
                    key={folder.id}
                    folder={folder}
                    isSelected={selectedFolders.has(folder.id)}
                    onToggle={() => toggleFolderSelection(folder.id)}
                    formatter={formatter}
                />
            ))}
        </div>
        </>
    )
}