"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Loader2} from "lucide-react";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";

import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {renameFolder} from "@/actions/actions";
import {useState} from "react";
import {toast} from "@/hooks/use-toast";
import {useTranslations} from "next-intl";
import {CreateFolderFormSchema} from "@/lib/definitions";

export default function RenameFolderDialog({openState, setOpenState, folderId, folderName}: { openState: boolean, setOpenState: any, folderId: string, folderName: string }) {

    const t = useTranslations("folders.dialog.rename");

    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof CreateFolderFormSchema>>({
        resolver: zodResolver(CreateFolderFormSchema),
        defaultValues: {
            name: "",
        }
    });

    function onSubmit(data: z.infer<typeof CreateFolderFormSchema>) {
        setLoading(true);
        renameFolder(folderId, data.name).then(d => {
            setLoading(false);

            if (d.error) {
                toast({
                    title: "Error",
                    description: `An error occurred while renaming the folder. ${d.error}`,
                    variant: "destructive"
                });
            }

            form.reset();
            toast({
                title: "Folder created",
                description: "The folders was renamed successfully.",
            });

            setOpenState(false);
        });
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
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
                                    <FormLabel>{t('fields.name.label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"Julien's birthday"} {...field} />
                                    </FormControl>
                                    <FormDescription>{t('fields.name.description', {folder: folderName})}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type={"button"} onClick={() => setOpenState(false)} variant="outline">{t('cancel')}</Button>
                            {loading
                                ? <Button disabled={true}><Loader2 className={"mr-2 animate-spin"}/> {t('submitting')}</Button>
                                : <Button type={"submit"}>{t('submit')}</Button>
                            }
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
