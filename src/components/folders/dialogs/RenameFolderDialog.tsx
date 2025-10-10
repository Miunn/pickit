"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { renameFolder } from "@/actions/folders";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { RenameFolderFormSchema } from "@/lib/definitions";

export default function RenameFolderDialog({
    openState,
    setOpenState,
    folderId,
    folderName,
}: {
    openState: boolean;
    setOpenState: (open: boolean) => void;
    folderId: string;
    folderName: string;
}) {
    const t = useTranslations("dialogs.folders.rename");

    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof RenameFolderFormSchema>>({
        resolver: zodResolver(RenameFolderFormSchema),
        defaultValues: {
            name: folderName,
        },
    });

    function onSubmit(data: z.infer<typeof RenameFolderFormSchema>) {
        setLoading(true);
        renameFolder(folderId, data.name)
            .then(d => {
                setLoading(false);

                if (d.error) {
                    toast({
                        title: t("errors.unknown.title"),
                        description: t("errors.unknown.description"),
                        variant: "destructive",
                    });
                }

                form.reset();
                toast({
                    title: t("success.title"),
                    description: t("success.description"),
                });

                setOpenState(false);
            })
            .catch(() => {
                setLoading(false);
                toast({
                    title: t("errors.unknown.title"),
                    description: t("errors.unknown.description"),
                    variant: "destructive",
                });
            });
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description", { folder: folderName })}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("form.name.label")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("form.name.placeholder")} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        {t("form.name.description", { folder: folderName })}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type={"button"} onClick={() => setOpenState(false)} variant="outline">
                                {t("actions.cancel")}
                            </Button>
                            {loading ? (
                                <Button disabled={true}>
                                    <Loader2 className={"mr-2 animate-spin"} /> {t("actions.submitting")}
                                </Button>
                            ) : (
                                <Button type={"submit"}>{t("actions.submit")}</Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
