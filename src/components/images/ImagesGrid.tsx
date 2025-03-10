'use client'

import { ImagePreviewGrid } from "@/components/images/ImagePreviewGrid";
import React, { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, X } from "lucide-react";
import { DeleteMultipleImagesDialog } from "@/components/images/DeleteMultipleImagesDialog";
import { CarouselDialog } from "@/components/images/CarouselDialog";
import { FolderWithImagesWithFolderAndComments, ImageWithComments, ImageWithFolder, UploadImagesFormSchema } from "@/lib/definitions";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { FileUploader } from "../generic/FileUploader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatBytes, getSortedFolderContent, handleImagesSubmission } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { ImagesSortMethod } from "../folders/SortImages";

export const ImagesGrid = ({ folder, sortState }: { folder: FolderWithImagesWithFolderAndComments, sortState: ImagesSortMethod }) => {
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const t = useTranslations("images");
    const deleteMultipleTranslations = useTranslations("dialogs.images.deleteMultiple");
    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [selectImageToDelete, setSelectImageToDelete] = useState<ImageWithFolder | null>(null);
    const [startIndex, setStartIndex] = useState(0);

    const [uploading, setUploading] = useState<boolean>(false);

    const [selecting, setSelecting] = useState<boolean>(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [sizeSelected, setSizeSelected] = useState<number>(0);

    const uploadImageForm = useForm<z.infer<typeof UploadImagesFormSchema>>({
        resolver: zodResolver(UploadImagesFormSchema),
        defaultValues: {
            images: []
        }
    });

    function submitImages(data: z.infer<typeof UploadImagesFormSchema>) {
        handleImagesSubmission(setUploading, data, uploadImageForm, folder.id, shareToken, tokenType, shareHashPin);
    }

    useEffect(() => {
        if (selected.length === 0) {
            setSelecting(false);
            setSizeSelected(0);
        }
    }, [selected]);

    return (
        <div>
            {selecting
                ? <div className={"flex justify-between items-center mb-5 bg-gray-50 rounded-2xl w-full p-2"}>
                    <div className={"flex gap-2 items-center"}>
                        <Button variant="ghost" onClick={() => {
                            setSelected([]);
                            setSizeSelected(0);
                            setSelecting(false);
                        }} size="icon"><X className={"w-4 h-4"} /></Button>
                        <h2><span className={"font-semibold"}>{selected.length} {t('selected')}</span> - {formatBytes(sizeSelected, { decimals: 2, sizeType: "normal" })}</h2>
                    </div>

                    <Button variant="outline" onClick={() => {
                        setOpenDeleteMultiple(true);
                    }}>
                        <Trash2 className={"mr-2"} /> {deleteMultipleTranslations('trigger')}
                    </Button>
                </div>
                : null
            }
            <div className={"flex flex-wrap gap-3"}>
                {folder.images.length == 0
                    ? <div className={"mx-auto flex flex-col justify-center items-center max-w-lg"}>
                        <Form {...uploadImageForm}>
                            <form onSubmit={uploadImageForm.handleSubmit(submitImages)} className="space-y-8">
                                <FormField
                                    control={uploadImageForm.control}
                                    name="images"
                                    render={({ field: { value, onChange, ...fieldProps } }) => (
                                        <FormItem>
                                            <FormLabel>{t('page.startUpload')}</FormLabel>
                                            <FormControl>
                                                <FileUploader
                                                    multiple={true}
                                                    maxSize={1024 * 1024 * 5}
                                                    maxFileCount={999}
                                                    accept={{
                                                        'image/png': ['.png'],
                                                        'image/jpeg': ['.jpg', '.jpeg'],
                                                        'image/gif': ['.gif'],
                                                        'image/webp': ['.webp'],
                                                    }}
                                                    onValueChange={(files) => onChange(files)}
                                                    {...fieldProps}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {uploading
                                    ? <Button className="ml-auto flex" type="button" disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading</Button>
                                    : <Button className="ml-auto flex" type="submit">Upload</Button>
                                }
                            </form>
                        </Form>
                    </div>
                    : getSortedFolderContent(folder, sortState).images.map((image: ImageWithFolder & ImageWithComments) => (
                        <Fragment key={image.id}>
                            <ImagePreviewGrid
                                image={image}
                                selected={selected}
                                onClick={() => {
                                    if (selecting) {
                                        if (selected.includes(image.id)) {
                                            setSelected(selected.filter((id) => id !== image.id));
                                            setSizeSelected(sizeSelected - image.size);
                                        } else {
                                            setSelected([...selected, image.id]);
                                            setSizeSelected(sizeSelected + image.size);
                                        }
                                    } else {
                                        setStartIndex(folder.images.indexOf(image));
                                        setCarouselOpen(true);
                                    }
                                }}
                                onSelect={() => {
                                    if (selected.includes(image.id)) {
                                        setSelected(selected.filter((id) => id !== image.id));
                                        setSizeSelected(sizeSelected - image.size);
                                    } else {
                                        setSelecting(true);
                                        setSelected([...selected, image.id]);
                                        setSizeSelected(sizeSelected + image.size);
                                    }
                                }}
                            />
                        </Fragment>
                    ))}
            </div>

            <CarouselDialog images={folder.images} title={folder.name} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteMultipleImagesDialog images={selected} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple} onDelete={() => {
                setSelected([]);
                setSelecting(false);
            }} />
        </div>
    )
}
