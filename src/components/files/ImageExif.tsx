import { FileWithFolder } from "@/lib/definitions";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import React from "react";
import { Label } from "../ui/label";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getCoordinatesString } from "@/lib/utils";

export default function ImageExif({ children, image }: { children: React.ReactNode, image: FileWithFolder }) {
    const t = useTranslations("dialogs.images.exif");

    return (
        <Dialog>
            {children
                ? <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                : null
            }
            <DialogContent className="flex flex-col gap-0 p-0 max-h-[min(680px,80vh)] sm:max-w-3xl">
                <DialogHeader className="border-b space-y-0 text-left px-6 py-4">
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription className="hidden sm:block">{t('description', { name: `${image.name}.${image.extension}` })}</DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto">
                    <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-6 p-6">
                        <div>
                            <Label>{t('width.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.width || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.width || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('height.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.height  || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.height || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('make.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.make || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.make || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('model.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.model || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.model || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('software.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.software || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.software || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('orientation.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.orientation || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.orientation || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('exposureTime.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.exposureTime || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.exposureTime || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('fNumber.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.fNumber || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.fNumber || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('iso.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.iso || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.iso || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('takenAt.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.takenAt?.toString() || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.takenAt?.toString() || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('modifiedAt.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.modifiedAt?.toString() || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.modifiedAt?.toString() || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('flash.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.flash || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.flash || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('focalLength.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.focalLength || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.focalLength || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('contrast.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.contrast || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.contrast || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('saturation.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.saturation || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.saturation || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('sharpness.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.sharpness || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.sharpness || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('whiteBalance.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.whiteBalance || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.whiteBalance || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div>
                            <Label>{t('gps.altitude.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate">{image.altitude || t('noData')}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.altitude || t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="col-span-2">
                            <Label>{t('gps.coordinates.label')}</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {image.latitude && image.longitude
                                            ? <Link href={`https://www.google.com/maps/search/?api=1&query=${image.latitude},${image.longitude}`} target="_blank" className="flex items-center gap-2 hover:underline hover:underline-offset-1">
                                                {getCoordinatesString(image.latitude, image.longitude)} <MapPin className="w-4 h-4" />
                                            </Link>
                                            : t('noData')
                                        }
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{image.latitude && image.longitude ? getCoordinatesString(image.latitude, image.longitude) : t('noData')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
                <DialogFooter className="border-t px-6 py-4 mt-0">
                    <DialogClose asChild>
                        <Button variant={"outline"}>{t('close')}</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}