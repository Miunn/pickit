import { ImageWithComments, ImageWithFolder } from "@/lib/definitions";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useTranslations } from "next-intl";
import ImagesCarousel from "../images/ImagesCarousel";
import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { changeFolderCover } from "@/actions/folders";
import { toast } from "@/hooks/use-toast";

export default function ChangeCoverFolderDialog({ images, folderId, open, setOpen }: { images: (ImageWithFolder & ImageWithComments)[], folderId: string, open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>> }) {

    const t = useTranslations("dialogs.folders.changeCover");

    const [current, setCurrent] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    async function submitCover() {
        setLoading(true);

        const image = images.at(current-1);

        if (!image) {
            return;
        }

        const r = await changeFolderCover(folderId, image.id);

        setLoading(false);

        if (r.error) {
            toast({
                title: t('errors.unknown.title'),
                description: t('errors.unknown.description'),
                variant: "destructive"
            });
            return;
        }

        setOpen(false);

        toast({
            title: t('success.title'),
            description: t('success.description'),
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={"w-full max-w-3xl"}>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <ImagesCarousel files={images.map((i) => ({ ...i, type: 'image' }))} startIndex={0} currentIndex={current} setCurrentIndex={setCurrent} />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={"outline"}>{t('actions.cancel')}</Button>
                    </DialogClose>
                    {loading
                        ? <Button disabled={true}><Loader2 className={"mr-2 animate-spin"} /> {t('actions.submitting')}</Button>
                        : <Button type={"submit"} onClick={submitCover}>{t('actions.submit')}</Button>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}