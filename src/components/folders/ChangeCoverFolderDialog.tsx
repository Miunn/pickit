import { ImageWithFolder } from "@/lib/definitions";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useTranslations } from "next-intl";
import ImagesCarousel from "../images/ImagesCarousel";
import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { changeFolderCover } from "@/actions/folders";
import { toast } from "@/hooks/use-toast";

export default function ChangeCoverFolderDialog({ images, open, setOpen }: { images: ImageWithFolder[], open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>> }) {

    const t = useTranslations("folders.dialog.cover");

    const [current, setCurrent] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    async function submitCover() {
        console.log(`Change cover index ${current-1}, image id: ${images.at(current-1)?.id}`)
        setLoading(true);

        const image = images.at(current-1);

        if (!image || !image.folder) {
            return;
        }

        const r = await changeFolderCover(image.folder.id, image.id);

        setLoading(false);

        if (r.error) {
            toast({
                title: "Cover change failed",
                description: "An error happened when trying to change folder's cover",
                variant: "destructive"
            });
            return;
        }

        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={"w-full max-w-3xl"}>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <ImagesCarousel images={images} startIndex={0} currentIndex={current} setCurrentIndex={setCurrent} />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={"outline"}>Cancel</Button>
                    </DialogClose>
                    {loading
                        ? <Button disabled={true}><Loader2 className={"mr-2 animate-spin"} /> {t('submitting')}</Button>
                        : <Button type={"submit"} onClick={submitCover}>{t('submit')}</Button>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}