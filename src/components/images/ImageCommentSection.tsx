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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useFormatter } from "next-intl";

export default function ImageCommentSection({ image, className, open, setOpen }: { image: ImageWithComments, className?: string, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {

    const formatter = useFormatter();
    const createCommentForm = useForm<z.infer<typeof CreateCommentFormSchema>>({
        resolver: zodResolver(CreateCommentFormSchema),
        defaultValues: {
            content: ""
        }
    })
    const [loading, setLoading] = React.useState<boolean>(false);

    async function submitComment(data: z.infer<typeof CreateCommentFormSchema>) {
        setLoading(true);

        const r = await createComment(image.id, data);

        setLoading(false);

        if (!r) {
            toast({
                title: "Error",
                description: "An error occurred while trying to post your comment",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Comment posted",
            description: "Your comment was posted successfully"
        });

        createCommentForm.reset();
    }

    return (
        <Collapsible className={cn("w-full", className)} open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="w-full flex justify-between items-center gap-2 font-semibold cursor-pointer bg-background hover:bg-accent transition-colors px-2 py-1 rounded-md">
                <span>{image.comments.length} Comments</span> <ArrowUpDown />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsibleLeave data-[state=open]:animate-collapsibleEnter px-2 py-1">
                <ScrollArea className="max-h-96">
                    <Form {...createCommentForm}>
                        <form onSubmit={createCommentForm.handleSubmit(submitComment)} className="flex flex-col items-end gap-2">
                            <FormField
                                name="content"
                                control={createCommentForm.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Leave a comment</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Add a comment..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {loading
                                ? <Button variant="secondary" className="px-6 rounded-full" disabled><Loader2 className="animate-spin" /> Post</Button>
                                : <Button variant="secondary" className="px-6 rounded-full">Post</Button>
                            }
                        </form>
                    </Form>

                    <div className="flex flex-col gap-2">
                        {image.comments.sort((a, b) => {
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        }).map((comment, index) => (
                            <div key={comment.id}>
                                <p className="text-sm font-semibold flex items-center gap-2">{ comment.createdById } <span className="font-light text-gray-500">{ formatter.relativeTime(comment.createdAt, new Date()) }</span></p>
                                <p>{comment.text}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CollapsibleContent>
        </Collapsible>
    )
}