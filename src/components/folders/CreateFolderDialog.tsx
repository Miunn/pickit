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
import {FolderPlus, Loader2} from "lucide-react";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";

import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {createFolder} from "@/actions/actions";
import {useState} from "react";
import {toast} from "@/hooks/use-toast";
import {useTranslations} from "next-intl";
import {CreateFolderFormSchema} from "@/lib/definitions";

export default function CreateFolderDialog() {

    const t = useTranslations("folders.actions");

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
                    title: "Error",
                    description: `An error occurred while creating the folder. ${d.error}`,
                    variant: "destructive"
                });
            }

            form.reset();
            toast({
                title: "Folder created",
                description: "The folders was created successfully.",
            });

            setOpen(false);
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className={"w-fit flex items-center"}>
                    <FolderPlus className={"mr-2"}/> {t('create')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Folder</DialogTitle>
                    <DialogDescription>
                        Create a new folder to organize your images.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Folder's name</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"Julien's birthday"} {...field} />
                                    </FormControl>
                                    <FormDescription>This will be your album name</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            {loading
                                ? <Button disabled={true}><Loader2 className={"mr-2 animate-spin"}/> Creating</Button>
                                : <Button type={"submit"}>Create</Button>
                            }
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
