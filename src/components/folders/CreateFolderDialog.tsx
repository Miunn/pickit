"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Loader2} from "lucide-react";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";

import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {createFolder} from "@/actions/folders";
import {useState} from "react";
import {toast} from "@/hooks/use-toast";
import {useTranslations} from "next-intl";
import {CreateFolderFormSchema} from "@/lib/definitions";

export default function CreateFolderDialog({ children }: { children: React.ReactNode }) {

    const t = useTranslations("dialogs.folders.create");

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof CreateFolderFormSchema>>({
        resolver: zodResolver(CreateFolderFormSchema),
        defaultValues: {
            name: "",
        }
    });

    function onSubmit(data: z.infer<typeof CreateFolderFormSchema>) {
        setLoading(true);
        createFolder(data.name).then(d => {
            setLoading(false);

            if (d.error) {
                toast({
                    title: t('errors.unknown.title'),
                    description: t('errors.unknown.description'),
                    variant: "destructive"
                });
                return;
            }

            form.reset();
            toast({
                title: t('success.title'),
                description: t('success.description'),
            });

            setOpen(false);
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            { children }
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('form.name.label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('form.name.placeholder')} {...field} />
                                    </FormControl>
                                    <FormDescription>{t('form.name.description')}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            {loading
                                ? <Button disabled={true}><Loader2 className={"mr-2 animate-spin"}/> {t('actions.submitting')}</Button>
                                : <Button type={"submit"}>{t('actions.submit')}</Button>
                            }
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
