import { useEffect, useMemo, useState } from "react";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../../ui/carousel";
import { Button } from "../../ui/button";
import { MessageCircle, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, formatBytes } from "@/lib/utils";
import ImageCommentSection from "./ImageCommentSection";
import { useSearchParams } from "next/navigation";
import EditDescriptionDialog from "../dialogs/EditDescriptionDialog";
import { Role, FileType } from "@prisma/client";
import { useSession } from "@/providers/SessionProvider";
import LoadingImage from "../LoadingImage";
import FileOptions from "./FileOptions";
import { ContextFile, useFilesContext } from "@/context/FilesContext";
import FileLikeButton from "../FileLikeButton";
import TagChip from "@/components/tags/TagChip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ImagesCarousel({ startIndex }: { readonly startIndex: number }) {
    const { sortedFiles, files, setFiles } = useFilesContext();
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const { user } = useSession();

    const t = useTranslations("components.images.carousel");
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentIndex, setCurrentIndex] = useState<number>(startIndex);

    const currentFile = useMemo<ContextFile | undefined>(() => {
        return sortedFiles[currentIndex];
    }, [currentIndex, sortedFiles]);

    useEffect(() => {
        if (!carouselApi) return;

        setCurrentIndex(carouselApi.selectedScrollSnap());

        carouselApi.on("select", () => {
            setCurrentIndex(carouselApi.selectedScrollSnap());
        });
    }, [carouselApi, setCurrentIndex]);

    return (
        <div className={"w-full overflow-hidden p-2 mx-auto"}>
            <div className="max-w-full flex justify-between items-center mb-2 gap-2 px-2">
                <div className="font-semibold truncate flex items-center gap-3">
                    <p className="truncate">{currentFile?.name}</p>
                    {currentFile && currentFile?.tags.length > 0 ? (
                        <div className="flex gap-1">
                            <TagChip tag={currentFile?.tags[0]} />
                            {currentFile?.tags.length > 1 && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <TagChip
                                                tag={{
                                                    id: "more",
                                                    name: `+${currentFile?.tags.length - 1}`,
                                                    color: currentFile?.tags[1].color,
                                                    createdAt: new Date(),
                                                    updatedAt: new Date(),
                                                    folderId: currentFile?.folderId,
                                                    userId: currentFile?.createdById,
                                                }}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-sm capitalize truncate">
                                                {currentFile?.tags
                                                    .slice(1)
                                                    .map(tag => tag.name)
                                                    .join(", ")}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    ) : null}
                </div>
                {currentFile ? (
                    <FileOptions file={currentFile} currentIndex={currentIndex} carouselApi={carouselApi} />
                ) : null}
            </div>
            <Carousel
                className="w-full h-fit mx-auto max-w-2xl mb-2"
                opts={{
                    align: "center",
                    loop: true,
                    startIndex: startIndex,
                    inViewThreshold: 0.5,
                }}
                setApi={setCarouselApi}
            >
                <CarouselContent className="h-fit">
                    {sortedFiles.map(file => (
                        <CarouselItem key={file.id} className="h-fit">
                            <div
                                className={
                                    "relative flex justify-center items-center p-2 transition-all duration-300 ease-in-out"
                                }
                            >
                                {file.type === FileType.VIDEO ? (
                                    <video
                                        className={
                                            "max-h-96 object-contain rounded-md transition-all duration-300 ease-in-out"
                                        }
                                        controls
                                        src={`/api/folders/${file.folder.id}/videos/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                    >
                                        <track kind="captions" />
                                    </video>
                                ) : (
                                    <LoadingImage
                                        src={`/api/folders/${file.folder.id}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                                        alt={file.name}
                                        className={
                                            "max-h-96 object-contain rounded-md transition-all duration-300 ease-in-out"
                                        }
                                        width={900}
                                        height={384}
                                        spinnerClassName="w-10 h-10 text-primary"
                                    />
                                )}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <div className="w-full grid grid-cols-2 items-center px-2">
                <p className="truncate">{currentFile?.folder.name}</p>
                <p className="text-sm text-muted-foreground text-nowrap text-end justify-self-end">
                    <span className="hidden sm:inline-block">{`${currentFile?.width}x${currentFile?.height}`}</span>{" "}
                    <span className="hidden sm:inline-block">-</span>{" "}
                    <span className="hidden sm:inline-block">{`${formatBytes(currentFile?.size || 0, { decimals: 2 })}`}</span>{" "}
                    <span className="hidden sm:inline-block">-</span>{" "}
                    <span>
                        {t("slide", {
                            current: currentIndex + 1,
                            total: sortedFiles.length,
                        })}
                    </span>
                </p>
            </div>

            <div className="w-full px-2 py-2 flex justify-between items-start gap-4">
                <p
                    className={cn(
                        "text-sm text-muted-foreground flex-1 whitespace-pre-wrap line-clamp-5",
                        currentFile?.description ? "" : "italic"
                    )}
                >
                    {currentFile?.description || t("noDescription")}
                </p>

                {currentFile ? (
                    <div className="flex items-center gap-2">
                        <FileLikeButton file={currentFile} />

                        <div className="flex items-center gap-0.5">
                            <p className="text-sm text-muted-foreground">{currentFile?.comments.length || 0}</p>
                            <ImageCommentSection file={currentFile}>
                                <Button
                                    variant={"ghost"}
                                    size={"icon"}
                                    type="button"
                                    className="size-7 p-0 rounded-full hover:bg-primary/20"
                                >
                                    <MessageCircle className="size-4" />
                                </Button>
                            </ImageCommentSection>
                        </div>

                        {user?.role.includes(Role.ADMIN) || user?.id === currentFile.folder.createdById ? (
                            <EditDescriptionDialog
                                file={currentFile}
                                onSuccess={description => {
                                    setFiles(
                                        files.map(file => {
                                            if (file.id === currentFile.id) {
                                                return { ...file, description: description };
                                            }
                                            return file;
                                        })
                                    );
                                }}
                            >
                                <Button
                                    variant={"ghost"}
                                    size={"icon"}
                                    type="button"
                                    className="size-7 p-0 rounded-full hover:bg-primary/20"
                                >
                                    <Pencil className="size-4" />
                                </Button>
                            </EditDescriptionDialog>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
