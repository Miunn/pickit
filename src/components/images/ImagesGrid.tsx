"use client";

import { ImagePreview } from "@/components/images/ImagePreview";
import React, { useEffect, useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useTranslations } from "next-intl";
import { DeleteImageDialog } from "@/components/images/DeleteImageDialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, X } from "lucide-react";
import { DeleteMultipleImagesDialog } from "@/components/images/DeleteMultipleImagesDialog";
import { CarouselDialog } from "@/components/images/CarouselDialog";
import { Image } from "@prisma/client";
import { FolderWithImages, UploadImagesFormSchema } from "@/lib/definitions";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { FileUploader } from "../generic/FileUploader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { handleImagesSubmission } from "@/lib/utils";

export const ImagesGrid = ({ folder }: { folder: FolderWithImages }) => {

    const t = useTranslations("images");
    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [selectImageToDelete, setSelectImageToDelete] = useState(null);
    const [startIndex, setStartIndex] = useState(0);

    const [uploading, setUploading] = useState<boolean>(false);

    const [selecting, setSelecting] = useState<boolean>(false);
    const [selected, setSelected] = useState<string[]>([]);

    const addSelected = (image: Image) => {
        setSelected([...selected, image.id]);
    }

    const removeSelected = (image: Image) => {
        setSelected(selected.filter((id) => id !== image.id));
    }

    const uploadImageForm = useForm<z.infer<typeof UploadImagesFormSchema>>({
        resolver: zodResolver(UploadImagesFormSchema),
        defaultValues: {
            images: []
        }
    });

    function submitImages(data: z.infer<typeof UploadImagesFormSchema>) {
        handleImagesSubmission(setUploading, data, folder.id, uploadImageForm);
    }

    useEffect(() => {
        if (selected.length === 0) {
            setSelecting(false);
        }
    }, [selected]);

    return (
        <div>
            {selecting
                ? <div className={"flex justify-between items-center mb-5 bg-gray-50 rounded-2xl w-full p-2"}>
                    <div className={"flex gap-2 items-center"}>
                        <Button variant="ghost" onClick={() => {
                            setSelected([]);
                            setSelecting(false);
                        }} size="icon"><X className={"w-4 h-4"} /></Button>
                        <h2 className={"font-semibold"}>{selected.length} {t('selected')}</h2>
                    </div>

                    <Button variant="outline" onClick={() => {
                        setOpenDeleteMultiple(true);
                    }}>
                        <Trash2 className={"mr-2"} /> {t('actions.delete')}
                    </Button>
                </div>
                : null
            }
            <div className={"flex flex-wrap gap-3"}>
                {folder.images.length == 0
                    ? <div className={"mx-auto flex flex-col justify-center items-center"}>
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
                                    ? <Button className="ml-auto flex" type="button" disabled><Loader2 className="w-4 h-4" /> Uploading</Button>
                                    : <Button className="ml-auto flex" type="submit">Upload</Button>
                                }
                            </form>
                        </Form>
                    </div>
                    : folder.images.map((image: any, index) => (
                        <ContextMenu key={image.id}>
                            <ContextMenuTrigger>
                                <button onClick={() => {
                                    if (selecting) {
                                        if (selected.includes(image.id)) {
                                            removeSelected(image);
                                        } else {
                                            addSelected(image);
                                        }
                                    } else {
                                        setStartIndex(index);
                                        setCarouselOpen(!carouselOpen)
                                    }
                                }} style={{ all: "unset", cursor: "pointer" }}>
                                    <ImagePreview image={image} folder={folder} withFolder={false} selected={selected.includes(image.id)} />
                                </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem onClick={() => {
                                    setStartIndex(index);
                                    setCarouselOpen(!carouselOpen);
                                }}>
                                    {t('actions.view')}
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => {
                                    setSelecting(true);
                                    addSelected(image);
                                }}>
                                    {t('actions.select')}
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => {
                                    setSelectImageToDelete(image);
                                    setOpenDelete(true);
                                }}>
                                    {t('actions.delete')}
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    ))}
            </div>

            <CarouselDialog folderId={folder.id} images={folder.images} title={folder.name!} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteImageDialog image={selectImageToDelete} open={openDelete} setOpen={setOpenDelete} />
            <DeleteMultipleImagesDialog images={selected} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple} setSelected={setSelected} setSelecting={setSelecting} />
        </div>
    )
}
