import { ImageWithFolder } from "@/lib/definitions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { copyImageToClipboard, formatBytes } from "@/lib/utils";
import { useFormatter } from "use-intl";
import React from "react";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";
import saveAs from "file-saver";
import { DeleteImageDialog } from "./DeleteImageDialog";

export default function PropertiesDialog({ image, open, setOpen }: { image: ImageWithFolder, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {

    const t = useTranslations("dialogs.images.properties");
    const formatter = useFormatter();

    const [copied, setCopied] = React.useState(false);

    const [isCopying, setIsCopying] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);

    const downloadImageHandler = async () => {
        setIsDownloading(true);
        const r = await fetch(`/api/folders/${image.folder.id}/images/${image.id}/download`);
        setIsDownloading(false);
        if (r.status === 404) {
            toast({
                title: "No images found",
                description: "There are no images in this folder to download"
            });
            return;
        }

        if (r.status !== 200) {
            toast({
                title: "Error",
                description: "An error occurred while trying to download this folder",
                variant: "destructive"
            });
            return;
        }

        saveAs(await r.blob(), `${image.name}.${image.extension}`);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription className="break-all text-ellipsis">{t('description', { name: image.name + '.' + image.extension })}</DialogDescription>
                </DialogHeader>

                <div className="w-full grid grid-cols-2 gap-y-12 gap-x-6 my-12">
                    <div>
                        <Label>{t('name')}</Label>
                        <p className="truncate">{image.name + '.' + image.extension}</p>
                    </div>

                    <div>
                        <Label>{t('parentFolder')}</Label>
                        <p>{image.folder.name}</p>
                    </div>

                    <div>
                        <Label>{t('size')}</Label>
                        <p>{formatBytes(image.size)}</p>
                    </div>

                    <div>
                        <Label>{t('dimensions')}</Label>
                        <p>{image.width} pixels x {image.height} pixels</p>
                    </div>

                    <div>
                        <Label>{t('uploadedAt')}</Label>
                        <p className="capitalize">{formatter.dateTime(image.createdAt, { month: "long", year: "numeric", day: "numeric" })}</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant={"outline"} onClick={async () => {
                        setIsCopying(true);
                        await copyImageToClipboard(image.folderId || '', image.id || '');
                        setIsCopying(false);

                        setCopied(true);
                        toast({
                            title: t('actions.copy.title'),
                            description: t('actions.copy.description'),
                            duration: 2000
                        });

                        setTimeout(() => {
                            setCopied(false);
                        }, 2000);
                    }} disabled={isCopying}>{copied
                        ? <><Check className="w-4 h-4 mr-2" /> {t('actions.copy.copied')}</>
                        : null
                        }
                        {isCopying
                            ? <><Loader2 className="animate-spin mr-2" /> {t('actions.copy.copying')}</>
                            : null
                        }
                        {!copied && !isCopying
                            ? t('actions.copy.trigger')
                            : null
                        }
                    </Button>
                    <Button onClick={downloadImageHandler} disabled={isDownloading}>
                        {isDownloading
                            ? <><Loader2 className="animate-spin mr-2" /> {t('actions.download.downloading')}</>
                            : t('actions.download.trigger')
                        }</Button>

                    <DeleteImageDialog image={image}>
                        <Button variant={"destructive"}>{t('actions.delete')}</Button>
                    </DeleteImageDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}