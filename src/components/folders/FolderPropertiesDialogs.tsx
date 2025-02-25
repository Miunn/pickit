'use client'

import { FolderWithImagesCount } from "@/lib/definitions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useFormatter, useTranslations } from "next-intl";
import { Label } from "../ui/label";
import { formatBytes } from "@/lib/utils";
import { Button } from "../ui/button";

export default function FolderPropertiesDialog({ folder, open, setOpen }: { folder: FolderWithImagesCount, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {
    const t = useTranslations("dialogs.folders.properties");
    const formatter = useFormatter();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription className="break-all text-ellipsis">{t('description', { name: folder.name })}</DialogDescription>
                </DialogHeader>

                <div className="w-full grid grid-cols-2 gap-y-12 gap-x-6 my-12">
                    <div>
                        <Label>{t('name')}</Label>
                        <p className="truncate">{folder.name}</p>
                    </div>

                    <div>
                        <Label>{t('imagesAmount.label')}</Label>
                        <p>{t('imagesAmount.value', { count: folder._count.images })}</p>
                    </div>

                    <div>
                        <Label>{t('size')}</Label>
                        <p>{formatBytes(folder.size, { decimals: 2 })}</p>
                    </div>

                    <div>
                        <Label>{t('createdAt')}</Label>
                        <p className="capitalize">{formatter.dateTime(folder.createdAt, { month: "long", year: "numeric", day: "numeric" })}</p>
                    </div>

                    <div>
                        <Label>{t('updatedAt')}</Label>
                        <p className="capitalize">{formatter.dateTime(folder.createdAt, { month: "long", year: "numeric", day: "numeric" })}</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button>
                        {t('actions.download.trigger')}
                    </Button>
                    <Button variant={"destructive"}>
                        {t('actions.delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}