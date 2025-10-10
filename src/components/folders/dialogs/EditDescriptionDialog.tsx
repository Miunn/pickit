import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../ui/dialog";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditFolderDescriptionFormSchema } from "@/lib/definitions";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import { Loader2 } from "lucide-react";
import { Folder } from "@prisma/client";
import { changeFolderDescription } from "@/actions/folders";
import { toast } from "sonner";
import { useState } from "react";

export default function EditDescriptionDialog({ folder, children, open, setOpen }: { folder: Folder, children?: React.ReactNode, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {
    const t = useTranslations("dialogs.folders.editDescription");
    const [internalOpen, setInternalOpen] = useState(false);
    const openState = open ?? internalOpen;
    const setOpenState = setOpen ?? setInternalOpen;

    const form = useForm<z.infer<typeof EditFolderDescriptionFormSchema>>({
        resolver: zodResolver(EditFolderDescriptionFormSchema),
        defaultValues: {
            description: folder.description ?? ""
        }
    });

    const onSubmit = async (data: z.infer<typeof EditFolderDescriptionFormSchema>) => {
        const r = await changeFolderDescription(folder.id, data.description);

        if (r.error) {
            toast.error(t("errors.unknown.title"), {
                description: t("errors.unknown.description")
            });
            return;
        }

        toast.success(t("success.title"), {
            description: t("success.description")
        });
        setOpenState(false);
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description", { folder: folder.name })}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("form.description.label")}</FormLabel>
                                    <FormControl>
                                        <Textarea rows={4} placeholder={t("form.description.placeholder")} {...field} />
                                    </FormControl>
                                    <FormDescription>{t("form.description.description")}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button" onClick={() => form.reset()}>{t("actions.cancel")}</Button>
                            </DialogClose>
                            {form.formState.isSubmitting
                                ? <Button disabled><Loader2 className="size-4 animate-spin" /> {t("actions.submitting")}</Button>
                                : <Button type="submit">{t("actions.submit")}</Button>
                            }
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
