import { ArrowUpDown, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CreateCommentFormSchema, FileWithComments, FileWithTags } from "@/lib/definitions";
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
import { Comment } from "@/components/files/comments/Comment";
import { useFilesContext } from "@/context/FilesContext";
import { SheetRounded, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet-rounded";
import TagChip from "@/components/tags/TagChip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet } from "@/components/ui/sheet";

export default function ImageCommentSection({ file, open, setOpen, children }: { file: FileWithComments & FileWithTags, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>>, children: React.ReactNode }) {
    const t = useTranslations("components.images.comments");
    const createCommentForm = useForm<z.infer<typeof CreateCommentFormSchema>>({
        resolver: zodResolver(CreateCommentFormSchema),
        defaultValues: {
            content: ""
        }
    });
    const isMobile = useIsMobile();

    const searchParams = useSearchParams();

    const { files, setFiles } = useFilesContext();

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

        setFiles(files.map((file) => {
            if (file.id === file.id) {
                return {
                    ...file,
                    comments: [...file.comments, r]
                }
            }

            return file;
        }))

        toast({
            title: t('success.title'),
            description: t('success.description')
        });

        createCommentForm.reset();
    }

    const content = (
        <>
            <ScrollArea className="flex-1 flex max-h-full flex-col">
                <div className="space-y-2">
                    {file.comments.sort((a, b) => {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    }).map((commentData) => (
                        <Fragment key={commentData.id}>
                            <Comment comment={commentData} />
                        </Fragment>
                    ))}
                </div>
            </ScrollArea>
            <Form {...createCommentForm}>
                <form onSubmit={createCommentForm.handleSubmit(submitComment)} className="space-y-2">
                    <FormField
                        name="content"
                        control={createCommentForm.control}
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>{t('form.text.label', { count: file.comments.length })}</FormLabel>
                                <FormControl>
                                    <Textarea placeholder={t('form.text.placeholder')} className="resize-none" rows={4} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex items-center justify-between gap-4">
                        <HoverCard>
                            <HoverCardTrigger>
                                <FormDescription className="hover:underline cursor-pointer">
                                    {t('privacy.trigger')}
                                </FormDescription>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-96">
                                <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('privacy.content') }} />
                            </HoverCardContent>
                        </HoverCard>
                        {createCommentForm.formState.isSubmitting
                            ? <Button variant="secondary" className="px-6 rounded-full" disabled><Loader2 className="animate-spin w-4 h-4 mr-2" /> {t('actions.submitting')}</Button>
                            : <Button variant="secondary" className="px-6 rounded-full">{t('actions.submit')}</Button>
                        }
                    </div>
                </form>
            </Form>
        </>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    {children}
                </SheetTrigger>
                <SheetContent className="max-h-[90%] flex flex-col" side={"bottom"}>
                    <SheetHeader className="flex-none">
                        <SheetTitle>{file.name}</SheetTitle>
                    </SheetHeader>
                    {content}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <SheetRounded open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="flex flex-col">
                <SheetHeader className="flex-none">
                    <SheetTitle>{file.name}</SheetTitle>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        {file.tags.map((tag) => (
                            <TagChip key={tag.id} tag={tag} className="px-2 py-1 rounded-md" />
                        ))}
                    </div>
                    <SheetDescription>
                        {file.description}
                    </SheetDescription>
                </SheetHeader>
                {content}
            </SheetContent>
        </SheetRounded>
    )
}