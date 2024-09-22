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
import {FolderPlus, ImageUp, Loader2} from "lucide-react";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {UploadImagesFormSchema} from "@/lib/definitions";
import {useState} from "react";
import {uploadImages} from "@/actions/actions";
import {toast} from "@/hooks/use-toast";
import {FileUploader} from "@/components/generic/FileUploader";

export const UploadImagesDialog = ({folderId}: {folderId: string}) => {

    const t = useTranslations("images.dialog.upload");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof UploadImagesFormSchema>>({
        resolver: zodResolver(UploadImagesFormSchema),
        defaultValues: {
            images: []
        }
    });

    function submitImages(data: z.infer<typeof UploadImagesFormSchema>) {
        setLoading(true);

        if (!data.images || data.images!.length === 0) {
            return;
        }

        console.log("Folder ID", folderId);
        console.log("Data", data);
        const formData = new FormData();

        for (let i = 0; i < data.images!.length; i++) {
            formData.append(`image-${i}`, data.images![i]);
        }

        console.log("Client form data", formData);
        uploadImages(folderId, data.images!.length, formData).then(r => {
            setLoading(false);

            if (r.error) {
                toast({
                    title: "Error",
                    description: r.error,
                    variant: "destructive"
                })
                return;
            }

            form.reset();
            toast({
                title: "Images uploaded",
                description: "The images were uploaded successfully."
            });

            setOpen(false);
        });
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
                {/*<Form {...form}>
                    <form onSubmit={form.handleSubmit(submitImages)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="images"
                            render={({field: { value, onChange, ...fieldProps }}) => (
                                <FormItem>
                                    <FormLabel>{t('fields.images.label')}</FormLabel>
                                    <FormControl>
                                        <Input {...fieldProps}
                                               placeholder={"Images"}
                                               type={"file"}
                                               multiple={true}
                                               accept="image/*"
                                               onChange={(e) => onChange(e.target.files)}
                                        />
                                    </FormControl>
                                    <FormDescription>{t('fields.images.description')}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            {loading
                                ? <Button disabled={true}><Loader2 className={"mr-2 animate-spin"} /> {t('submitting')}</Button>
                                : <Button type={"submit"}>{t('submit')}</Button>
                            }
                        </DialogFooter>
                    </form>
                </Form>*/}
                <FileUploader multiple={true} maxFileCount={999} />
            </DialogContent>
        </Dialog>
    )
}
