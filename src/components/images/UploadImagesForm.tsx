'use client'

import { UploadImagesFormSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { FileUploader } from "../generic/FileUploader";
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner"
import { uploadImages } from "@/actions/images";
import { Progress } from "../ui/progress";
import { formatBytes } from "@/lib/utils";

export default function UploadImagesForm({ folderId, onUpload }: { folderId: string, onUpload?: () => void }) {
    const t = useTranslations("components.images.uploadImagesForm");
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const uploadImageForm = useForm<z.infer<typeof UploadImagesFormSchema>>({
        resolver: zodResolver(UploadImagesFormSchema),
        defaultValues: {
            images: []
        }
    });

    async function submitImages(data: z.infer<typeof UploadImagesFormSchema>) {
        if (!data.images || data.images!.length === 0) {
            return false;
        }

        toast(
            <div className="w-full">
                {t('ongoing.title')}
                <Progress value={0} className="w-full mt-2" />
            </div>,
            {
                id: "progress-toast",
                duration: Infinity,
                classNames: {
                    content: "w-full",
                    title: "w-full"
                }
            }
        )

        let error = false;
        let notUploadedAmount = 0;
        const formData = new FormData();
        for (let i = 0; i < data.images!.length; i++) {
            const uploadUrlId = crypto.randomUUID();
            formData.set("image", new File([data.images![i]], data.images![i].name, { type: data.images![i].type }));
            formData.set("name", data.images![i].name);
            formData.set("uploadUrlId", uploadUrlId);
            const r = await uploadImages(folderId, formData, shareToken, tokenType, shareHashPin);

            if (r.error) {
                error = true;
                if (r.error === "not-enough-storage") {
                    notUploadedAmount++;
                    toast.error(t('errors.not-enough-storage', { name: data.images[i].name, used: formatBytes(Number(r.used)), max: formatBytes(Number(r.max)) }));
                } else if (r.error === 'invalid-file') {
                    notUploadedAmount++;
                    toast.error(t('errors.invalid-file', { name: data.images[i].name }))
                }
            }

            if (r.uploadUrls) {
                await fetch(r.uploadUrls[uploadUrlId], {
                    method: "PUT",
                    body: new File([data.images![i]], data.images![i].name, { type: data.images![i].type }),
                    headers: {
                        "Content-Type": 'application/octet-stream'
                    }
                })
            }

            toast(
                <div className="w-full">
                    {t('ongoing.title')}
                    <Progress value={Math.round(((i + 1) / data.images!.length) * 100)} className="w-full mt-2" />
                </div>,
                {
                    id: "progress-toast"
                }
            )
        }

        setTimeout(() => {
            toast.dismiss("progress-toast");
        }, 2000);

        if (data.images!.length - notUploadedAmount > 0) {
            toast.success(`${data.images!.length - notUploadedAmount} images uploaded successfully`);
            uploadImageForm.reset();
        }


        if (onUpload) {
            onUpload();
        }
    }

    return (
        <Form {...uploadImageForm}>
            <form onSubmit={uploadImageForm.handleSubmit(submitImages)} className="space-y-8">
                <FormField
                    control={uploadImageForm.control}
                    name="images"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem className="max-w-[443px]">
                            <FormLabel>{t('label')}</FormLabel>
                            <FormControl>
                                <FileUploader
                                    multiple={true}
                                    maxSize={1024 * 1024 * 1000}
                                    maxFileCount={999}
                                    accept={{
                                        'image/png': ['.png'],
                                        'image/jpeg': ['.jpg', '.jpeg'],
                                        'image/gif': ['.gif'],
                                        'image/webp': ['.webp'],
                                        'video/x-msvideo': ['.avi'],
                                        'video/mp4': ['.mp4', '.MP4'],
                                        'video/quicktime': ['.mov'],
                                        'video/mpeg': ['.mpg', '.mpeg'],
                                        'video/x-flv': ['.flv'],
                                        'video/*': ['.webm']
                                    }}
                                    onValueChange={(files) => onChange(files)}
                                    {...fieldProps}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {uploadImageForm.formState.isSubmitting
                    ? <Button className="ml-auto flex" type="button" disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('actions.submitting')}</Button>
                    : <Button className="ml-auto flex" type="submit">{t('actions.submit')}</Button>
                }
            </form>
        </Form>
    )
}