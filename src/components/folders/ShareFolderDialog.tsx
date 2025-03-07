"use client"

import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon, Loader2, Lock, Share2, Unlock, X } from "lucide-react";
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
import { AccessToken, FolderTokenPermission, PersonAccessToken } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { addMonths, format, set } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { createMultiplePersonAccessTokens } from "@/actions/accessTokensPerson";
import { unlockAccessToken } from "@/actions/accessTokens";
import LockTokenDialog from "./LockTokenDialog";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../ui/input-otp";

export const ShareFolderDialog = ({ folder, open, setOpen }: { folder: FolderWithAccessToken, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const locale = useLocale();
    const t = useTranslations("dialogs.folders.share");
    const [loadingShare, setLoadingShare] = useState(false);
    const [tokenList, setTokenList] = useState<{ email: string, permission: FolderTokenPermission, expiryDate: Date, pinCode?: string }[]>([]);
    const emailScroll = useRef<HTMLDivElement>(null);
    const validTokens = folder.AccessToken.filter((token) => token.expires > new Date() && token.isActive);

    const [openLockToken, setOpenLockToken] = useState(false);
    const [lockToken, setLockToken] = useState<AccessToken | PersonAccessToken | null>(null);
    const [lockTokenType, setLockTokenType] = useState<"accessToken" | "personAccessToken">("accessToken");

    const [showPersonAccessTokenLock, setShowPersonAccessTokenLock] = useState(false);

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

    const addEmail = ({ email, permission, expiresAt, pinCode }: z.infer<typeof CreatePersonAccessTokenFormSchema>) => {
        const emailSchema = z.string().email();
        if (!email || email.length === 0 || tokenList.map((t) => t.email).includes(email) || !emailSchema.safeParse(email).success) {
            toast({
                title: t('toast.emailAdd.error.title'),
                description: t('toast.emailAdd.error.description'),
                variant: "destructive"
            })
            return;
        }

        // Reset email field
        sharePersonAccessTokenForm.setValue("email", "");
        sharePersonAccessTokenForm.setValue("expiresAt", addMonths(new Date(), 3));
        sharePersonAccessTokenForm.setValue("permission", FolderTokenPermission.READ);
        sharePersonAccessTokenForm.setValue("pinCode", "");
        setShowPersonAccessTokenLock(false);
        setTokenList([...tokenList, { email, permission, expiryDate: expiresAt, pinCode }]);
    }

    const submitSharePersonTokens = async () => {
        setLoadingShare(true);
        const r = await createMultiplePersonAccessTokens(folder.id, tokenList);
        setLoadingShare(false);

        if (r.error) {
            toast({
                title: t('toast.submit.error.title'),
                description: t('toast.submit.error.description'),
                variant: "destructive"
            })
            return;
        }

        setTokenList([]);

        toast({
            title: t('toast.submit.success.title'),
            description: t('toast.submit.success.description'),
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
    }, [tokenList]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                {!open && !setOpen ? <DialogTrigger asChild>
                    <Button variant="outline">
                        <Share2 className="mr-2" /> {t('trigger')}
                    </Button>
                </DialogTrigger> : null}
                <DialogContent className={`${showPersonAccessTokenLock ? "w-[66rem]" : "w-[48rem]"} max-w-max transition-all overflow-hidden`}>
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>{t('description')}</DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-between items-center">
                        <Label>{t('links.label')}</Label>
                        <Button variant={"link"} className="pr-0" asChild>
                            <Link href={`/${locale}/app/links`}>{t('manageAccesses')}</Link>
                        </Button>
                    </div>
                    <div className={"grid grid-cols-[0.3fr_1fr_auto_auto] gap-3 items-center"}>
                        {validTokens.length > 0
                            ? validTokens.sort((a, b) => a.permission.localeCompare(b.permission)).map((token) => <Fragment key={token.token}>
                                <Label className="capitalize">{
                                    token.permission === FolderTokenPermission.READ
                                        ? t('links.link.permissions.read')
                                        : t('links.link.permissions.write')
                                }</Label>
                                <Input placeholder={t('links.link.placeholder')} disabled={true}
                                    value={`${typeof window !== 'undefined' ? window.location.origin : process.env.APP_URL}/app/folders/${folder.id}?share=${token.token}`} />
                                {token.locked
                                    ? <Button variant={"outline"} size={"icon"} onClick={() => unlockAccessToken(token.id)}><Lock className="w-4 h-4" /></Button>
                                    : <Button variant={"outline"} size={"icon"} onClick={() => {
                                        setLockToken(token);
                                        setLockTokenType("accessToken");
                                        setOpenLockToken(true);
                                    }}><Unlock className="w-4 h-4" /></Button>
                                }
                                <Button onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : process.env.APP_URL}/app/folders/${folder.id}?share=${token.token}`)} className="text-start">
                                    {t('links.link.copy')}
                                </Button>
                            </Fragment>)
                            : <p className="col-span-3 text-sm">{t('links.empty')}</p>}
                    </div>
                    <Separator orientation={"horizontal"} className={"my-4"} />

                    <Label>{t('people.title')}</Label>
                    <Form {...sharePersonAccessTokenForm}>
                        <form onSubmit={sharePersonAccessTokenForm.handleSubmit(addEmail)} className="flex gap-3 w-full items-end">
                            <FormField
                                control={sharePersonAccessTokenForm.control}
                                name={"permission"}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col w-24">
                                        <FormLabel>{t('people.form.permission.label')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('people.form.permission.placeholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={FolderTokenPermission.READ}>{t('people.form.permission.options.read')}</SelectItem>
                                                <SelectItem value={FolderTokenPermission.WRITE}>{t('people.form.permission.options.write')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={sharePersonAccessTokenForm.control}
                                name={"email"}
                                render={({ field }) => (
                                    <FormItem className="flex-1 flex flex-col min-w-52">
                                        <FormLabel>{t('people.form.email.label')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('people.form.email.placeholder')} {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={sharePersonAccessTokenForm.control}
                                name="expiresAt"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col w-52">
                                        <FormLabel>{t('people.form.expiryDate.label')}</FormLabel>
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

                            <div className="flex items-end">
                                <FormField
                                    control={sharePersonAccessTokenForm.control}
                                    name="pinCode"
                                    render={({ field }) => (
                                        <FormItem className={`flex flex-col transition-all ${showPersonAccessTokenLock ? "w-72 mr-2" : "overflow-hidden w-0 mr-0"}`}>
                                            <FormLabel className="text-nowrap">{t('people.form.pinCode.label')}</FormLabel>
                                            <FormControl>
                                                <InputOTP maxLength={8} pattern={REGEXP_ONLY_DIGITS} {...field}>
                                                    <InputOTPGroup>
                                                        <InputOTPSlot index={0} />
                                                        <InputOTPSlot index={1} />
                                                        <InputOTPSlot index={2} />
                                                        <InputOTPSlot index={3} />
                                                        <InputOTPSlot index={4} />
                                                        <InputOTPSlot index={5} />
                                                        <InputOTPSlot index={6} />
                                                        <InputOTPSlot index={7} />
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button variant={"outline"} size={"icon"} onClick={() => setShowPersonAccessTokenLock(!showPersonAccessTokenLock)} type="button">{showPersonAccessTokenLock
                                    ? <X className="w-4 h-4" />
                                    : <Unlock className="w-4 h-4" />
                                }
                                </Button>
                            </div>


                            <Button type="submit">{t('buttons.emailAdd')}</Button>
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
                                    {token.pinCode
                                        ? <Button variant={"outline"} size={"icon"} disabled><Lock className="w-4 h-4" /></Button>
                                        : null
                                    }
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
            <LockTokenDialog tokenId={lockToken?.id || ""} tokenType={lockTokenType} openState={openLockToken} setOpenState={setOpenLockToken} />
        </>
    )
}
