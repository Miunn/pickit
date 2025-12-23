import { FileWithComments, FileWithTags, FolderWithTags } from "@/lib/definitions";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Loader2 } from "lucide-react";
import { changeFolderCover } from "@/actions/folders";
import { toast } from "@/hooks/use-toast";
import {
    Carousel,
    CarouselNext,
    CarouselItem,
    CarouselPrevious,
    CarouselApi,
    CarouselContent,
} from "../../ui/carousel";
import LoadingImage from "../../files/LoadingImage";
import { formatBytes } from "@/lib/utils";

export default function ChangeCoverFolderDialog({
    images,
    folderId,
    open,
    setOpen,
}: {
    images: ({ folder: FolderWithTags } & FileWithTags & FileWithComments)[];
    folderId: string;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const t = useTranslations("dialogs.folders.changeCover");

    const [loading, setLoading] = useState<boolean>(false);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    async function submitCover() {
        setLoading(true);

        const image = images.at(currentIndex);

        if (!image) {
            return;
        }

        const r = await changeFolderCover(folderId, image.id);

        setLoading(false);

        if (r.error) {
            toast({
                title: t("errors.unknown.title"),
                description: t("errors.unknown.description"),
                variant: "destructive",
            });
            return;
        }

        setOpen(false);

        toast({
            title: t("success.title"),
            description: t("success.description"),
        });
    }

    useEffect(() => {
        if (!carouselApi) return;

        setCurrentIndex(carouselApi.selectedScrollSnap());

        carouselApi.on("select", () => {
            setCurrentIndex(carouselApi.selectedScrollSnap());
        });
    }, [carouselApi, setCurrentIndex]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={"w-full max-w-3xl"}>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <div>
                    <p className="font-semibold truncate">{images[currentIndex]?.name}</p>
                    <Carousel
                        className="w-full h-fit mx-auto max-w-xl"
                        opts={{
                            align: "center",
                            loop: true,
                            startIndex: 0,
                        }}
                        setApi={setCarouselApi}
                    >
                        <CarouselContent className="h-fit">
                            {images.map(file => (
                                <CarouselItem key={file.id} className="h-fit">
                                    <div
                                        className={`relative flex justify-center items-center p-2 transition-all duration-300 ease-in-out`}
                                    >
                                        <LoadingImage
                                            src={`/api/folders/${file.folder.id}/images/${file.id}`}
                                            alt={file.name}
                                            className={`max-h-96 object-contain rounded-md transition-all duration-300 ease-in-out`}
                                            width={900}
                                            height={384}
                                            spinnerClassName="w-10 h-10 text-primary"
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                    <div className="w-full grid grid-cols-2 items-center px-2">
                        <p className="truncate">{images[currentIndex]?.folder.name}</p>
                        <p className="text-sm text-muted-foreground text-nowrap text-end justify-self-end">
                            <span className="hidden sm:inline-block">{`${images[currentIndex]?.width}x${images[currentIndex]?.height}`}</span>{" "}
                            <span className="hidden sm:inline-block">-</span>{" "}
                            <span className="hidden sm:inline-block">{`${formatBytes(images[currentIndex]?.size, { decimals: 2 })}`}</span>{" "}
                            <span className="hidden sm:inline-block">-</span>{" "}
                            <span>{t("slide", { current: currentIndex + 1, total: images.length })}</span>
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={"outline"}>{t("actions.cancel")}</Button>
                    </DialogClose>
                    {loading ? (
                        <Button disabled={true}>
                            <Loader2 className={"mr-2 animate-spin"} /> {t("actions.submitting")}
                        </Button>
                    ) : (
                        <Button type={"submit"} onClick={submitCover}>
                            {t("actions.submit")}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
