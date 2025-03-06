import { ArrowUpDown, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "@/lib/utils";
import { CreateCommentFormSchema, ImageWithComments } from "@/lib/definitions";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { createComment } from "@/actions/comments";
import { toast } from "@/hooks/use-toast";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useFormatter, useTranslations } from "next-intl";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { useSearchParams } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function ImageCommentSection({ image, className, open, setOpen }: { image: ImageWithComments, className?: string, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {

    const t = useTranslations("components.images.comments");
    const formatter = useFormatter();
    const createCommentForm = useForm<z.infer<typeof CreateCommentFormSchema>>({
        resolver: zodResolver(CreateCommentFormSchema),
        defaultValues: {
            content: ""
        }
    })
    const [loading, setLoading] = React.useState<boolean>(false);
    const searchParams = useSearchParams();

    async function submitComment(data: z.infer<typeof CreateCommentFormSchema>) {
        setLoading(true);

        const r = await createComment(image.id, data, searchParams.get("share"), searchParams.get("t") === "p" ? "personAccessToken" : "accessToken", searchParams.get("h"));

        setLoading(false);

        if (!r) {
            toast({
                title: t('errors.unknown.title'),
                description: t('errors.unknown.description'),
                variant: "destructive"
            });
            return;
        }

        toast({
            title: t('success.title'),
            description: t('success.description')
        });

        createCommentForm.reset();
    }

    return (
        <Collapsible className={cn("w-full", className)} open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="w-full flex justify-between items-center gap-2 font-semibold cursor-pointer bg-background hover:bg-accent transition-colors px-2 py-1 rounded-md">
                <span>{ t('trigger', { count: image.comments.length }) }</span> <ArrowUpDown />
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
                            {loading
                                ? <Button variant="secondary" className="px-6 rounded-full" disabled><Loader2 className="animate-spin w-4 h-4 mr-2" /> { t('actions.submitting') }</Button>
                                : <Button variant="secondary" className="px-6 rounded-full">{ t('actions.submit') }</Button>
                            }
                        </div>
                    </form>
                </Form>
                <ScrollArea className="flex max-h-64 flex-col px-2 mt-4">
                    {image.comments.sort((a, b) => {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    }).map((comment) => (
                        <div key={comment.id}>
                            <p className="text-sm font-semibold flex items-center gap-2">
                                {comment.name}
                                <Tooltip>
                                    <TooltipTrigger>
                                        <span className="font-light text-gray-500">{formatter.relativeTime(comment.createdAt, new Date())}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span className="capitalize">{formatter.dateTime(comment.createdAt, { weekday: "long", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "numeric" })}</span>
                                    </TooltipContent>
                                </Tooltip>
                            </p>
                            <p className="text-sm">{comment.text}</p>
                        </div>
                    ))}
                </ScrollArea>
            </CollapsibleContent>
        </Collapsible>
    )
}