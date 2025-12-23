import { useEffect, useState } from "react";
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

export default function ImagesCarousel({ files, startIndex }: { files: ContextFile[]; startIndex: number }) {
    const { setFiles } = useFilesContext();
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const { user } = useSession();

    const t = useTranslations("components.images.carousel");
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentIndexInternalState, setCurrentIndexInternalState] = useState<number>(startIndex);
    const currentIndexState = currentIndexInternalState;

    useEffect(() => {
        if (!carouselApi) return;

        setCurrentIndexInternalState(carouselApi.selectedScrollSnap());

        carouselApi.on("select", () => {
            setCurrentIndexInternalState(carouselApi.selectedScrollSnap());
        });
    }, [carouselApi, setCurrentIndexInternalState]);

    return (
        <div className={"w-full overflow-hidden p-2 mx-auto"}>
            <div className="max-w-full flex justify-between items-center mb-2 gap-2 px-2">
                <div className="font-semibold truncate flex items-center gap-3">
                    <p className="truncate">{files[currentIndexState]?.name}</p>
                    {files[currentIndexState]?.tags.length > 0 && (
                        <div className="flex gap-1">
                            <TagChip tag={files[currentIndexState]?.tags[0]} />
                            {files[currentIndexState]?.tags.length > 1 && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <TagChip
                                                tag={{
                                                    id: "more",
                                                    name: `+${files[currentIndexState]?.tags.length - 1}`,
                                                    color: files[currentIndexState]?.tags[1].color,
                                                    createdAt: new Date(),
                                                    updatedAt: new Date(),
                                                    folderId: files[currentIndexState]?.folderId,
                                                    userId: files[currentIndexState]?.createdById,
                                                }}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-sm capitalize truncate">
                                                {files[currentIndexState]?.tags
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
                <FileOptions
                    file={files[currentIndexState]}
                    fullScreenCarouselFiles={files}
                    currentIndexState={currentIndexState}
                    carouselApi={carouselApi}
                />
            </div>
            <Carousel
                className="w-full h-fit mx-auto max-w-xl mb-2"
                opts={{
                    align: "center",
                    loop: true,
                    startIndex: startIndex,
                    inViewThreshold: 0.5,
                }}
                setApi={setCarouselApi}
            >
                <CarouselContent className="h-fit">
                    {files.map(file => (
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
                                    />
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
                <p className="truncate">{files[currentIndexState]?.folder.name}</p>
                <p className="text-sm text-muted-foreground text-nowrap text-end justify-self-end">
                    <span className="hidden sm:inline-block">{`${files[currentIndexState]?.width}x${files[currentIndexState]?.height}`}</span>{" "}
                    <span className="hidden sm:inline-block">-</span>{" "}
                    <span className="hidden sm:inline-block">{`${formatBytes(files[currentIndexState]?.size, { decimals: 2 })}`}</span>{" "}
                    <span className="hidden sm:inline-block">-</span>{" "}
                    <span>
                        {t("slide", {
                            current: currentIndexState + 1,
                            total: files.length,
                        })}
                    </span>
                </p>
            </div>

            <div className="w-full px-2 py-2 flex justify-between items-start gap-4">
                <p
                    className={cn(
                        "text-sm text-muted-foreground flex-1 whitespace-pre-wrap line-clamp-5",
                        files[currentIndexState].description ? "" : "italic"
                    )}
                >
                    {files[currentIndexState].description || t("noDescription")}
                </p>

                <div className="flex items-center gap-2">
                    <FileLikeButton file={files[currentIndexState]} />

                    <div className="flex items-center gap-0.5">
                        <p className="text-sm text-muted-foreground">{files[currentIndexState].comments.length}</p>
                        <ImageCommentSection file={files[currentIndexState]}>
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

                    {user?.role.includes(Role.ADMIN) || user?.id === files[currentIndexState].folder.createdById ? (
                        <EditDescriptionDialog
                            file={files[currentIndexState]}
                            onSuccess={description => {
                                setFiles(
                                    files.map(file => {
                                        if (file.id === files[currentIndexState].id) {
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
            </div>
        </div>
    );
}
