"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateAccessTokenFormSchema, LightFolder } from "@/lib/definitions";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { addYears } from "date-fns";
import { fr, enUS as en } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createNewAccessToken } from "@/actions/accessTokens";
import { toast } from "@/hooks/use-toast";
import { useFormatter, useLocale, useTranslations } from "next-intl";

export default function CreateAccessTokenDialog({
    children,
    folders,
}: {
    readonly children?: React.ReactNode;
    readonly folders: LightFolder[];
}) {
    const locale = useLocale();
    const intlFormatter = useFormatter();
    const t = useTranslations("dialogs.accessTokens.create");
    const [loading, setLoading] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);

    const newTokenForm = useForm<z.infer<typeof CreateAccessTokenFormSchema>>({
        resolver: zodResolver(CreateAccessTokenFormSchema),
        defaultValues: {
            folder: folders[0] ? folders[0].id : undefined,
            permission: "READ",
            expiresAt: addYears(new Date(), 1),
        },
    });

    async function submit(data: z.infer<typeof CreateAccessTokenFormSchema>) {
        setLoading(true);

        const r = await createNewAccessToken(data.folder, data.permission, data.expiresAt);

        setLoading(false);

        if (r.error) {
            toast({
                title: t("errors.unknown.title"),
                description: t("errors.unknown.description"),
                variant: "destructive",
            });
            return;
        }

        toast({
            title: t("success.title"),
            description: t("success.description"),
        });

        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children}
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>
                <Form {...newTokenForm}>
                    <form onSubmit={newTokenForm.handleSubmit(submit)} className="space-y-6">
                        <FormField
                            control={newTokenForm.control}
                            name="folder"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("form.folder.label")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-[462px] truncate">
                                                <SelectValue placeholder="Select a folder" className="truncate" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {folders.map(folder => (
                                                <SelectItem key={folder.id} value={folder.id} className="truncate">
                                                    {folder.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={newTokenForm.control}
                            name="permission"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel>{t("form.permissions.label")}</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-px"
                                        >
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="READ" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    {t("form.permissions.options.read")}
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="WRITE" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    {t("form.permissions.options.write")}
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={newTokenForm.control}
                            name="expiresAt"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{t("form.expiry.label")}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "text-left font-normal capitalize",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        intlFormatter.dateTime(field.value, {
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={date => date < new Date()}
                                                locale={(locale === "fr" && fr) || en}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>{t("form.expiry.description")}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="outline">{t("actions.cancel")}</Button>
                            </DialogClose>
                            {loading ? (
                                <Button type="button" disabled={true}>
                                    <Loader2 className={"mr-2 animate-spin"} /> {t("actions.submitting")}
                                </Button>
                            ) : (
                                <Button type="submit">{t("actions.submit")}</Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
