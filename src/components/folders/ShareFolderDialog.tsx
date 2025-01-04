"use client"

import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon, Loader2, Share2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { CreatePersonAccessTokenFormSchema, FolderWithAccessToken } from "@/lib/definitions";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderTokenPermission } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { addMonths, format, set } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { createMultiplePersonAccessTokens } from "@/actions/accessTokensPerson";

export const ShareFolderDialog = ({ folder, open, setOpen }: { folder: FolderWithAccessToken, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const locale = useLocale();
    const [loadingShare, setLoadingShare] = useState(false);
    const [tokenList, setTokenList] = useState<{ email: string, permission: FolderTokenPermission, expiryDate: Date }[]>([]);
    const emailScroll = useRef<HTMLDivElement>(null);
    const t = useTranslations("folders.dialog.share");
    const validTokens = folder.AccessToken.filter((token) => token.expires > new Date() && token.isActive);

    const sharePersonAccessTokenForm = useForm<z.infer<typeof CreatePersonAccessTokenFormSchema>>({
        resolver: zodResolver(CreatePersonAccessTokenFormSchema),
        defaultValues: {
            permission: FolderTokenPermission.READ,
            email: "",
            expiresAt: addMonths(new Date(), 3)
        }
    })

    const copyToClipboard = (link: string) => {
        navigator.clipboard.writeText(link).then(() => {
            toast({
                title: t('toast.copy.success.title'),
                description: t('toast.copy.success.description'),
            })
        }).catch(() => {
            toast({
                title: t('toast.copy.error.title'),
                description: t('toast.copy.error.description'),
                variant: "destructive"
            })
        });
    }

    const addEmail = ({ email, permission, expiresAt }: z.infer<typeof CreatePersonAccessTokenFormSchema>) => {
        const emailSchema = z.string().email();
        if (!email || email.length === 0 || tokenList.map((t) => t.email).includes(email) || !emailSchema.safeParse(email).success) {
            toast({
                title: t('fields.email.error.title'),
                description: t('fields.email.error.description'),
                variant: "destructive"
            })
            return;
        }

        // Reset email field
        sharePersonAccessTokenForm.setValue("email", "");
        setTokenList([...tokenList, { email, permission, expiryDate: expiresAt }]);
    }

    const submitSharePersonTokens = async () => {
        setLoadingShare(true);
        const r = await createMultiplePersonAccessTokens(folder.id, tokenList);
        setLoadingShare(false);

        if (r.error) {
            toast({
                title: t('toast.error.title'),
                description: t('toast.error.description'),
                variant: "destructive"
            })
            return;
        }

        setTokenList([]);

        toast({
            title: t('toast.success.title'),
            description: t('toast.success.description'),
        });

        if (setOpen) {
            setOpen(false);
        }
    }

    useEffect(() => {
        if (!emailScroll.current) {
            return;
        }

        emailScroll.current!.scrollIntoView(false);
        console.log(tokenList);
    }, [tokenList]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                {!open && !setOpen ? <DialogTrigger asChild>
                    <Button variant="outline">
                        <Share2 className="mr-2" /> {t('trigger')}
                    </Button>
                </DialogTrigger> : null}
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>{t('description')}</DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-between items-center">
                        <Label>{t('fields.link.label')}</Label>
                        <Button variant={"link"} className="pr-0" asChild>
                            <Link href={`/${locale}/dashboard/links`}>
                                Manage accesses
                            </Link>
                        </Button>
                    </div>
                    <div className={"grid gap-3 w-full items-center"} style={{
                        gridTemplateColumns: "0.3fr 1fr auto"
                    }}>
                        {validTokens.length > 0
                            ? validTokens.sort((a, b) => a.permission.localeCompare(b.permission)).map((token) => <Fragment key={token.token}>
                                <Label className="capitalize">{token.permission}</Label>
                                <Input placeholder={t('fields.link.placeholder')} disabled={true}
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/folders/${folder.id}?share=${token.token}`} />
                                <Button onClick={() => copyToClipboard(token.token)} className="text-start">
                                    {t('button.copy')}
                                </Button>
                            </Fragment>)
                            : <p className="col-span-3 text-sm">No links exists for this folder</p>}
                    </div>
                    <Separator orientation={"horizontal"} className={"my-4"} />

                    <Label>Share to people</Label>
                    <Form {...sharePersonAccessTokenForm}>
                        <form onSubmit={sharePersonAccessTokenForm.handleSubmit(addEmail)} className="flex gap-3 w-full items-end">
                            <FormField
                                control={sharePersonAccessTokenForm.control}
                                name={"permission"}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col w-24">
                                        <FormLabel>Permission</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Permission" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={FolderTokenPermission.READ}>Read</SelectItem>
                                                <SelectItem value={FolderTokenPermission.WRITE}>Write</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={sharePersonAccessTokenForm.control}
                                name={"email"}
                                render={({ field }) => (
                                    <FormItem className="flex-1 flex flex-col">
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('fields.email.placeholder')} {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={sharePersonAccessTokenForm.control}
                                name="expiresAt"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col w-52">
                                        <FormLabel>Expiry date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
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
                                                    disabled={(date) => date < new Date()}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </FormItem>
                                )}
                            />

                            <Button type="submit">{t('button.emailAdd')}</Button>
                        </form>
                    </Form>
                    <ScrollArea className={"max-h-40"}>
                        <div ref={emailScroll}>
                            {tokenList.map((token) => (
                                <div key={token.email} className={"flex gap-1 w-full my-1"}>
                                    <Button onClick={() => setTokenList(tokenList.filter((e) => e.email !== token.email))} variant="ghost" size="icon" className="w-9 h-9">
                                        <X className={"w-4 h-4 text-red-500"} />
                                    </Button>
                                    <Select value={token.permission} disabled>
                                        <SelectTrigger className="w-24">
                                            <SelectValue placeholder="Permission" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={FolderTokenPermission.READ}>Read</SelectItem>
                                            <SelectItem value={FolderTokenPermission.WRITE}>Write</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input value={token.email} disabled={true} className="w-fit flex-1" />
                                    <Button
                                        variant={"outline"}
                                        className={"text-left font-normal w-52"}
                                        disabled
                                    >
                                        {format(token.expiryDate, "PPP")}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        {loadingShare
                            ? <Button disabled><Loader2 className={"w-4 h-4 mr-2 animate-spin"} /> Sending emails</Button>
                            : <Button onClick={submitSharePersonTokens}>Share</Button>}

                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
