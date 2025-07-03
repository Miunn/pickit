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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { updateComment } from "@/actions/comments";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Comment } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
import { EditCommentFormSchema } from "@/lib/definitions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useFilesContext } from "@/context/FilesContext";

type FormData = z.infer<typeof EditCommentFormSchema>;

export default function EditCommentDialog({ comment, open, setOpen, children }: {
    comment: Comment,
    open?: boolean,
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>,
    children?: React.ReactNode
}) {
    const { files, setFiles } = useFilesContext();
    const t = useTranslations("dialogs.comments.edit");
    const [editing, setEditing] = useState(false);
    const searchParams = useSearchParams();

    const form = useForm<FormData>({
        resolver: zodResolver(EditCommentFormSchema),
        defaultValues: {
            content: comment.text
        }
    });

    const onSubmit = async (data: FormData) => {
        setEditing(true);
        const r = await updateComment(
            comment.id,
            data.content,
            searchParams.get("share"),
            searchParams.get("h"),
        );
        setEditing(false);

        if (!r) {
            toast({
                title: t('errors.unknown.title'),
                description: t('errors.unknown.description'),
                variant: "destructive"
            });
            return;
        }

        setFiles(files.map((file) => {
            if (file.id === comment.fileId) {
                return {
                    ...file,
                    comments: file.comments.map((c) => {
                        if (c.id === comment.id) {
                            return r;
                        }

                        return c;
                    })
                }
            }

            return file;
        }));

        setOpen?.(false);

        toast({
            title: t('success.title'),
            description: t('success.description'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('content.placeholder')}
                                            rows={4}
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" onClick={() => setOpen?.(false)} variant="outline">
                                {t('actions.cancel')}
                            </Button>
                            {editing ? (
                                <Button disabled={true}>
                                    <Loader2 className="mr-2 animate-spin" /> {t('actions.submitting')}
                                </Button>
                            ) : (
                                <Button type="submit">{t('actions.submit')}</Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
