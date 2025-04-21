import { FileWithFolder } from "@/lib/definitions";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import exifr from 'exifr';
import React from "react";
import { useSearchParams } from "next/navigation";
import { Label } from "../ui/label";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getCoordinatesString, getDMSstringWithDirection } from "@/lib/utils";

export default function ImageExif({ children, image }: { children: React.ReactNode, image: FileWithFolder }) {
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p";

    const [exifData, setExifData] = React.useState<any>({});

    const t = useTranslations("dialogs.images.exif");

    React.useEffect(() => {
        exifr.parse(`/api/folders/${image.folderId}/images/${image.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType}`, true).then((exif) => {
            if (!exif) return;

            setExifData(exif);
        });
    }, [image, shareToken, shareHashPin, tokenType]);

    return (
        <Dialog>
            {children
                ? <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                : null
            }
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description', { name: `${image.name}.${image.extension}` })}</DialogDescription>
                </DialogHeader>

                <div className="w-full grid grid-cols-4 gap-y-6 gap-x-6 my-12">
                    <div>
                        <Label>{t('width.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.ImageWidth || exifData.ExifImageWidth || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.ImageWidth || exifData.ExifImageWidth || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('height.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.ImageHeight || exifData.ExifImageHeight || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.ImageHeight || exifData.ExifImageHeight || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('make.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Make || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Make || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('model.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Model || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Model || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('software.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Software || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Software || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('orientation.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Orientation || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Orientation || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('exposureTime.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.ExposureTime || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.ExposureTime || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('fNumber.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.FNumber || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.FNumber || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('iso.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.ISO || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.ISO || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('takenAt.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.DateTimeOriginal?.toString() || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.DateTimeOriginal?.toString() || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('modifiedAt.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.ModifyDate?.toString() || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.ModifyDate?.toString() || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('flash.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Flash || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Flash || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('focalLength.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.FocalLength || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.FocalLength || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('contrast.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Contrast || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Contrast || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('saturation.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Saturation || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Saturation || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('sharpness.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Sharpness || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Sharpness || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('whiteBalance.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.WhiteBalance || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.WhiteBalance || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label>{t('gps.altitude.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.Altitude || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.Altitude || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="col-span-2">
                        <Label>{t('gps.coordinates.label')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {exifData.latitude && exifData.longitude
                                        ? <Link href={`https://www.google.com/maps/search/?api=1&query=${exifData.latitude},${exifData.longitude}`} target="_blank" className="flex items-center gap-2 hover:underline hover:underline-offset-1">
                                            {getCoordinatesString(exifData.latitude, exifData.longitude)} <MapPin className="w-4 h-4" />
                                        </Link>
                                        : t('noData')
                                    }
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.latitude && exifData.longitude ? getCoordinatesString(exifData.latitude, exifData.longitude) : t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {/* <Label className="flex items-center justify-between gap-2">
                            {t('gps.latitude.label')}
                            {exifData.latitude && exifData.longitude
                                ? <Link href={`https://www.google.com/maps/search/?api=1&query=${exifData.latitude},${exifData.longitude}`} target="_blank">
                                    <MapPin className="w-4 h-4" />
                                </Link>
                                : null
                            }
                        </Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.latitude || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.latitude || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Label className="flex items-center justify-between gap-2">
                            {t('gps.longitude.label')}
                            {exifData.latitude && exifData.longitude
                                ? <Link href={`https://www.google.com/maps/search/?api=1&query=${exifData.latitude},${exifData.longitude}`} target="_blank">
                                    <MapPin className="w-4 h-4" />
                                </Link>
                                : null
                            }
                        </Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="truncate">{exifData.longitude || t('noData')}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{exifData.longitude || t('noData')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider> */}
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={"outline"}>Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}