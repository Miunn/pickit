"use client";

import {useTranslations} from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {ImageUp, Loader2} from "lucide-react";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {UploadImagesFormSchema} from "@/lib/definitions";
import {useState} from "react";
import {FileUploader} from "@/components/generic/FileUploader";
import { handleImagesSubmission } from "@/lib/utils";

export const UploadImagesDialog = ({folderId}: { folderId: string }) => {

    const t = useTranslations("images.dialog.upload");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof UploadImagesFormSchema>>({
        resolver: zodResolver(UploadImagesFormSchema),
        defaultValues: {
            images: []
        }
    });

    async function submitImages(data: z.infer<typeof UploadImagesFormSchema>) {
        const r = await handleImagesSubmission(setLoading, data, folderId, form);

        if (r) {
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className={"w-fit flex items-center"}>
                    <ImageUp className={"mr-2"}/> {t('trigger')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submitImages)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="images"
                            render={({field: {value, onChange, ...fieldProps}}) => (
                                <FormItem>
                                    <FormLabel>{t('fields.images.label')}</FormLabel>
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
                                    <FormDescription>{t('fields.images.description')}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            {loading
                                ? <Button disabled={true}><Loader2 className={"w-4 h-4 mr-2 animate-spin"}/> {t('submitting')}
                                </Button>
                                : <Button type={"submit"}>{t('submit')}</Button>
                            }
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
