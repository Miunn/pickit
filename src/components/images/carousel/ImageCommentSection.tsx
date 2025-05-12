import { ArrowUpDown, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CreateCommentFormSchema, FileWithComments } from "@/lib/definitions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createComment } from "@/actions/comments";
import { toast } from "@/hooks/use-toast";
import React, { Fragment } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useSearchParams } from "next/navigation";
import { Comment } from "@/components/comments/Comment";
import { useFolderContext } from "@/context/FolderContext";
export default function ImageCommentSection({ file, className, open, setOpen }: { file: FileWithComments, className?: string, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {
    const t = useTranslations("components.images.comments");
    const createCommentForm = useForm<z.infer<typeof CreateCommentFormSchema>>({
        resolver: zodResolver(CreateCommentFormSchema),
        defaultValues: {
            content: ""
        }
    })
    const searchParams = useSearchParams();

    const { folder, setFolder } = useFolderContext();

    async function submitComment(data: z.infer<typeof CreateCommentFormSchema>) {
        const r = await createComment(file.id, data, searchParams.get("share"), searchParams.get("t") === "p" ? "personAccessToken" : "accessToken", searchParams.get("h"));

        if (!r) {
            toast({
                title: t('errors.unknown.title'),
                description: t('errors.unknown.description'),
                variant: "destructive"
            });
            return;
        }

        setFolder({
            ...folder,
            files: folder.files.map((file) => {
                if (file.id === file.id) {
                    return {
                        ...file,
                        comments: [...file.comments, r]
                    }
                }

                return file;
            })
        })

        toast({
            title: t('success.title'),
            description: t('success.description')
        });

        createCommentForm.reset();
    }

    return (
        <Collapsible className={cn("w-full", className)} open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="w-full flex justify-between items-center gap-2 font-semibold cursor-pointer bg-background hover:bg-accent transition-colors px-2 py-1 rounded-md">
                <span>{ t('trigger', { count: file.comments.length }) }</span> <ArrowUpDown />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsibleLeave data-[state=open]:animate-collapsibleEnter">
                <Form {...createCommentForm}>
                    <form onSubmit={createCommentForm.handleSubmit(submitComment)} className="space-y-2">
                        <FormField
                            name="content"
                            control={createCommentForm.control}
                            render={({ field }) => (
                                <FormItem className="w-full px-2">
                                    <FormLabel>{ t('form.text.label') }</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={ t('form.text.placeholder') } className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center justify-between gap-4 px-2">
                            <HoverCard>
                                <HoverCardTrigger>
                                    <FormDescription className="hover:underline cursor-pointer">
                                        { t('privacy.trigger') }
                                    </FormDescription>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-96">
                                    <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('privacy.content') }} />
                                </HoverCardContent>
                            </HoverCard>
                            {createCommentForm.formState.isSubmitting
                                ? <Button variant="secondary" className="px-6 rounded-full" disabled><Loader2 className="animate-spin w-4 h-4 mr-2" /> { t('actions.submitting') }</Button>
                                : <Button variant="secondary" className="px-6 rounded-full">{ t('actions.submit') }</Button>
                            }
                        </div>
                    </form>
                </Form>
                <ScrollArea className="flex max-h-64 flex-col px-2 mt-4">
                    {file.comments.sort((a, b) => {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    }).map((commentData) => (
                        <Fragment key={commentData.id}>
                            <Comment comment={commentData} />
                        </Fragment>
                    ))}
                </ScrollArea>
            </CollapsibleContent>
        </Collapsible>
    )
}