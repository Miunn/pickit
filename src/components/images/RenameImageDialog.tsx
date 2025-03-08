'use client'

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { CreateFolderFormSchema } from "@/lib/definitions";
import { Image } from "@prisma/client";
import { renameImage } from "@/actions/images";

export default function RenameImageDialog({ openState, setOpenState, image }: { openState: boolean, setOpenState: any, image: Image }) {

    const t = useTranslations("dialogs.images.rename");

    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof CreateFolderFormSchema>>({
        resolver: zodResolver(CreateFolderFormSchema),
        defaultValues: {
            name: "",
        }
    });

    function onSubmit(data: z.infer<typeof CreateFolderFormSchema>) {
        setLoading(true);
        renameImage(image.id, data).then(d => {
            setLoading(false);

            if (d.error) {
                toast({
                    title: t('errors.unknown.title'),
                    description: t('errors.unknown.description'),
                    variant: "destructive"
                });
            }

            form.reset();
            toast({
                title: t('success.title'),
                description: t('success.description'),
            });

            setOpenState(false);
        }).catch((r) => {
            setLoading(false);
            toast({
                title: t('errors.unknown.title'),
                description: t('errors.unknown.description'),
                variant: "destructive"
            });
        });
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description', { name: image.name })}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.name.label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('form.name.placeholder')} {...field} />
                                    </FormControl>
                                    <FormDescription>{t('form.name.description', { name: image.name })}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type={"button"} variant="outline">{t('actions.cancel')}</Button>
                            </DialogClose>
                            {loading
                                ? <Button disabled={true}><Loader2 className={"mr-2 animate-spin"} /> {t('actions.submitting')}</Button>
                                : <Button type={"submit"}>{t('actions.submit')}</Button>
                            }
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
