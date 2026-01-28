import TagChip from "@/components/tags/TagChip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBytes, isNewFile } from "@/lib/utils";
import { CirclePlay } from "lucide-react";
import LoadingImage from "@/components/files/LoadingImage";
import { FileType } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { FileWithTags } from "@/lib/definitions";
import { useFormatter, useTranslations } from "next-intl";

/**
 * Renders a thumbnail card for a file including its preview, tags, metadata, and contextual badges.
 *
 * Shows an image or video thumbnail (with a play icon for videos), a "New" badge when recently created,
 * a primary tag chip and a "+N" chip that reveals remaining tags in a tooltip, the file name, a short
 * formatted creation date (with a full date/time tooltip), and the human-readable file size.
 *
 * @param file - The file and its tags to render (FileWithTags)
 * @returns A JSX element representing the file thumbnail card
 */
export default function FileThumbnail({ file }: { readonly file: FileWithTags }) {
    const t = useTranslations("images");
    const formatter = useFormatter();
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share") || "";
    const shareHashPin = searchParams.get("h") || "";
    const tokenType = searchParams.get("t") || "";

    return (
        <>
            <div className={`relative h-32 sm:h-36 mb-4 flex justify-center items-center group`}>
                {file.type === FileType.VIDEO ? (
                    <LoadingImage
                        // src={file.signedUrl}
                        src={`/api/folders/${file.folderId}/videos/${file.id}/thumbnail?share=${shareToken}&h=${shareHashPin}&t=${tokenType}`}
                        alt={file.name}
                        className={"relative border border-primary rounded-xl object-cover"}
                        spinnerClassName={"text-primary"}
                        sizes="33vw"
                        fill
                    />
                ) : (
                    <LoadingImage
                        // src={file.signedUrl}
                        src={`/api/folders/${file.folderId}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType}`}
                        alt={file.name}
                        className={"relative border border-primary rounded-xl object-cover"}
                        spinnerClassName={"text-primary"}
                        sizes="33vw"
                        fill
                    />
                )}
                {file.type === FileType.VIDEO ? (
                    <CirclePlay
                        className="absolute left-2 bottom-2 text-white opacity-80 group-hover:opacity-100 transition-all duration-200 ease-in-out"
                        size={25}
                    />
                ) : null}

                {/* New banner overlay */}
                {isNewFile(file.createdAt) && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-lg transform rotate-12 z-10">
                        {t("new")}
                    </div>
                )}

                {file.tags.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <TagChip tag={file.tags[0]} />
                        {file.tags.length > 1 && (
                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <TagChip
                                            tag={{
                                                id: "more",
                                                name: `+${file.tags.length - 1}`,
                                                color: file.tags[1].color,
                                                createdAt: new Date(),
                                                updatedAt: new Date(),
                                                folderId: file.folderId,
                                                userId: file.createdById,
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-sm capitalize truncate">
                                            {file.tags
                                                .slice(1)
                                                .map(tag => tag.name)
                                                .join(", ")}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                )}
            </div>
            <p className={"text-start truncate"}>{file.name}</p>
            <div className={"text-sm h-4 flex items-center justify-between"}>
                <div className="h-full flex items-center">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p className={"text-sm opacity-60 capitalize truncate"}>
                                    {formatter.dateTime(file.createdAt, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className={"text-sm capitalize truncate"}>
                                    {formatter.dateTime(file.createdAt, {
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
                <p className="text-muted-foreground text-nowrap">{formatBytes(file.size)}</p>
            </div>
        </>
    );
}