"use client";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon, ChevronLeft, Eye, Loader2, Lock, Pen, Share2, Unlock, X } from "lucide-react";
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
import { AccessToken, FolderTokenPermission } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { addMonths, format } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "../../ui/calendar";
import { createMultipleAccessTokens } from "@/actions/accessTokens";
import { unlockAccessToken } from "@/actions/accessTokens";
import LockTokenDialog from "./LockTokenDialog";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../../ui/input-otp";
import { motion, AnimatePresence } from "motion/react";

export const ShareFolderDialog = ({
    folder,
    open,
    setOpen,
}: {
    folder: FolderWithAccessToken;
    open?: boolean;
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const locale = useLocale();
    const t = useTranslations("dialogs.folders.share");
    const [loadingShare, setLoadingShare] = useState(false);
    const [tokenList, setTokenList] = useState<
        { email: string; permission: FolderTokenPermission; expiryDate: Date; pinCode?: string; allowMap?: boolean }[]
    >([]);
    const emailScroll = useRef<HTMLDivElement>(null);
    const validTokens = useMemo(
        () => folder.accessTokens.filter(token => token.expires > new Date() && token.isActive && !token.email),
        [folder.accessTokens]
    );

    const [openLockToken, setOpenLockToken] = useState(false);
    const [lockToken, setLockToken] = useState<AccessToken | null>(null);
    //const [lockTokenType, setLockTokenType] = useState<"accessToken" | "personAccessToken">("accessToken");

    const [openExpiryDatePopover, setOpenExpiryDatePopover] = useState(false);
    //const [showPersonAccessTokenLock, setShowPersonAccessTokenLock] = useState(false);

    // New state for the two-step process
    const [showMessageStep, setShowMessageStep] = useState(false);
    const [shareMessage, setShareMessage] = useState("");

    const sharePersonAccessTokenForm = useForm<z.infer<typeof CreatePersonAccessTokenFormSchema>>({
        resolver: zodResolver(CreatePersonAccessTokenFormSchema),
        defaultValues: {
            permission: FolderTokenPermission.READ,
            email: "",
            expiresAt: addMonths(new Date(), 3),
            allowMap: false,
        },
    });

    const copyToClipboard = (link: string) => {
        navigator.clipboard
            .writeText(link)
            .then(() => {
                toast({
                    title: t("toast.copy.success.title"),
                    description: t("toast.copy.success.description"),
                });
            })
            .catch(() => {
                toast({
                    title: t("toast.copy.error.title"),
                    description: t("toast.copy.error.description"),
                    variant: "destructive",
                });
            });
    };

    const addEmail = ({
        email,
        permission,
        expiresAt,
        pinCode,
        allowMap,
    }: z.infer<typeof CreatePersonAccessTokenFormSchema>) => {
        const emailSchema = z.string().email();
        if (
            !email ||
            email.length === 0 ||
            tokenList.map(t => t.email).includes(email) ||
            !emailSchema.safeParse(email).success
        ) {
            toast({
                title: t("toast.emailAdd.error.title"),
                description: t("toast.emailAdd.error.description"),
                variant: "destructive",
            });
            return;
        }

        console.log("Add email", { email, permission, expiryDate: expiresAt, pinCode, allowMap });

        //setShowPersonAccessTokenLock(false);
        setTokenList([...tokenList, { email, permission, expiryDate: expiresAt, pinCode, allowMap }]);
        sharePersonAccessTokenForm.reset();
    };

    const submitSharePersonTokens = async () => {
        setLoadingShare(true);
        console.log("Submit share person tokens", { tokenList, shareMessage });
        const r = await createMultipleAccessTokens(
            folder.id,
            tokenList.map(token => ({
                ...token,
                message: shareMessage,
            }))
        );
        setLoadingShare(false);

        if (r.error) {
            toast({
                title: t("toast.submit.error.title"),
                description: t("toast.submit.error.description"),
                variant: "destructive",
            });
            return;
        }

        setTokenList([]);
        setShareMessage("");
        setShowMessageStep(false);

        toast({
            title: t("toast.submit.success.title"),
            description: t("toast.submit.success.description"),
        });

        if (setOpen) {
            setOpen(false);
        }
    };

    const handleShareClick = () => {
        if (tokenList.length === 0) {
            toast({
                title: t("toast.noContacts.title") || "No contacts",
                description: t("toast.noContacts.description") || "Please add at least one contact before sharing",
                variant: "destructive",
            });
            return;
        }
        setShowMessageStep(true);
    };

    const handleBackToContacts = () => {
        setShowMessageStep(false);
    };

    useEffect(() => {
        if (!emailScroll.current) {
            return;
        }

        emailScroll.current!.scrollIntoView(false);
    }, [tokenList]);

    // Function to render the share view (contacts management)
    const renderShareView = () => {
        return (
            <>
                <div className="flex flex-row justify-between items-center gap-2">
                    <Label className="font-medium">{t("links.label")}</Label>
                    <Button variant={"link"} className="pr-0 pl-0 sm:pl-2" asChild>
                        <Link href={`/${locale}/app/links`}>{t("manageAccesses")}</Link>
                    </Button>
                </div>
                <div className={"grid grid-cols-[0.3fr_1fr] sm:grid-cols-[0.3fr_1fr_auto] gap-3 items-center mb-4"}>
                    {validTokens.length > 0 ? (
                        validTokens
                            .sort((a, b) => a.permission.localeCompare(b.permission))
                            .map(token => (
                                <Fragment key={token.token}>
                                    <Label className="capitalize text-sm">
                                        {token.permission === FolderTokenPermission.READ
                                            ? t("links.link.permissions.read")
                                            : t("links.link.permissions.write")}
                                    </Label>
                                    <Input
                                        className="hidden sm:block"
                                        placeholder={t("links.link.placeholder")}
                                        disabled={true}
                                        value={`${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL}/app/folders/${folder.id}?share=${token.token}`}
                                    />
                                    <div className="flex items-center gap-2">
                                        {token.locked ? (
                                            <Button
                                                variant={"outline"}
                                                size={"icon"}
                                                onClick={() => unlockAccessToken(token.id)}
                                            >
                                                <Lock className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant={"outline"}
                                                size={"icon"}
                                                onClick={() => {
                                                    setLockToken(token);
                                                    //setLockTokenType("accessToken");
                                                    setOpenLockToken(true);
                                                }}
                                            >
                                                <Unlock className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() =>
                                                copyToClipboard(
                                                    `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL}/app/folders/${folder.id}?share=${token.token}`
                                                )
                                            }
                                            className="text-start flex-1 sm:flex-none"
                                        >
                                            {t("links.link.copy")}
                                        </Button>
                                    </div>
                                </Fragment>
                            ))
                    ) : (
                        <p className="col-span-1 sm:col-span-3 text-sm">{t("links.empty")}</p>
                    )}
                </div>
                <Separator orientation={"horizontal"} className={"my-4"} />

                <div className="space-y-4">
                    <Label className="font-medium">{t("people.title")}</Label>
                    <Form {...sharePersonAccessTokenForm}>
                        <form onSubmit={sharePersonAccessTokenForm.handleSubmit(addEmail)} className="">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                    <FormField
                                        control={sharePersonAccessTokenForm.control}
                                        name={"permission"}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col sm:w-24">
                                                <FormLabel>{t("people.form.permission.label")}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={t("people.form.permission.placeholder")}
                                                            />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value={FolderTokenPermission.READ}>
                                                            {t("people.form.permission.options.read")}
                                                        </SelectItem>
                                                        <SelectItem value={FolderTokenPermission.WRITE}>
                                                            {t("people.form.permission.options.write")}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={sharePersonAccessTokenForm.control}
                                        name={"email"}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col flex-1">
                                                <FormLabel>{t("people.form.email.label")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t("people.form.email.placeholder")}
                                                        className=" mg:max-w-auto"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={sharePersonAccessTokenForm.control}
                                        name="expiresAt"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col sm:w-48">
                                                <FormLabel>{t("people.form.expiryDate.label")}</FormLabel>
                                                <Popover
                                                    open={openExpiryDatePopover}
                                                    onOpenChange={setOpenExpiryDatePopover}
                                                    modal={true}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "text-left font-normal w-full",
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
                                                            disabled={date => date < new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button type="submit" className="w-full sm:w-auto">
                                    {t("buttons.emailAdd")}
                                </Button>
                            </div>

                            <div className="flex flex-row gap-6">
                                <Button
                                    type="button"
                                    variant={"link"}
                                    onClick={() =>
                                        sharePersonAccessTokenForm.setValue(
                                            "allowMap",
                                            !sharePersonAccessTokenForm.watch("allowMap")
                                        )
                                    }
                                    className="text-xs text-muted-foreground px-0 font-normal"
                                >
                                    {t("people.form.allowMap.label")}{" "}
                                    {sharePersonAccessTokenForm.watch("allowMap")
                                        ? t("people.form.allowMap.yes")
                                        : t("people.form.allowMap.no")}
                                </Button>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant={"link"}
                                            className="text-xs text-muted-foreground px-0 font-normal"
                                        >
                                            {t("people.form.pinCode.label")}{" "}
                                            {sharePersonAccessTokenForm.watch("pinCode")
                                                ? t("people.form.pinCode.yes")
                                                : t("people.form.pinCode.no")}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t("people.form.pinCode.dialog.title")}</DialogTitle>
                                            <DialogDescription>
                                                {t("people.form.pinCode.dialog.description")}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <FormField
                                            control={sharePersonAccessTokenForm.control}
                                            name="pinCode"
                                            render={({ field }) => (
                                                <FormItem className={`mx-auto`}>
                                                    <FormControl>
                                                        <InputOTP maxLength={8} pattern={REGEXP_ONLY_DIGITS} {...field}>
                                                            <InputOTPGroup>
                                                                <InputOTPSlot index={0} />
                                                                <InputOTPSlot index={1} />
                                                                <InputOTPSlot index={2} />
                                                                <InputOTPSlot index={3} />
                                                            </InputOTPGroup>
                                                            <InputOTPSeparator />
                                                            <InputOTPGroup>
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
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant={"ghost"}>
                                                    {t("people.form.pinCode.dialog.cancel")}
                                                </Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button
                                                    type="button"
                                                    variant={"outline"}
                                                    onClick={() =>
                                                        sharePersonAccessTokenForm.setValue("pinCode", undefined)
                                                    }
                                                >
                                                    {t("people.form.pinCode.dialog.remove")}
                                                </Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        sharePersonAccessTokenForm.setValue(
                                                            "pinCode",
                                                            sharePersonAccessTokenForm.watch("pinCode")
                                                        )
                                                    }
                                                >
                                                    {t("people.form.pinCode.dialog.save")}
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </form>
                    </Form>
                    <ScrollArea className={"max-h-32 md:max-h-40 border rounded-md p-2 w-full"}>
                        <div ref={emailScroll} className="space-y-2">
                            {tokenList.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    {t("people.empty") || "No contacts added yet"}
                                </p>
                            ) : (
                                tokenList.map(token => (
                                    <div key={token.email} className={"flex gap-2 p-2 rounded-md bg-muted/30"}>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() =>
                                                    setTokenList(tokenList.filter(e => e.email !== token.email))
                                                }
                                                variant="ghost"
                                                size="icon"
                                                className="flexw-8 h-8"
                                            >
                                                <X className={"w-4 h-4 text-red-500"} />
                                            </Button>
                                        </div>
                                        <Select value={token.permission} disabled>
                                            <SelectTrigger className="hidden sm:flex w-24">
                                                <SelectValue placeholder="Permission" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={FolderTokenPermission.READ}>
                                                    {t("people.form.permission.options.read")}
                                                </SelectItem>
                                                <SelectItem value={FolderTokenPermission.WRITE}>
                                                    {t("people.form.permission.options.write")}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex sm:hidden items-center">
                                            <Button variant="outline" size="icon" className="flex sm:hidden" disabled>
                                                {token.permission === FolderTokenPermission.READ ? (
                                                    <Eye className="w-4 h-4" />
                                                ) : (
                                                    <Pen className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <Input value={token.email} disabled={true} className="sm:w-fit sm:flex-1" />
                                        <div className="hidden sm:flex items-center gap-2">
                                            <Button
                                                variant={"outline"}
                                                className={"text-left font-normal w-full sm:w-52"}
                                                disabled
                                            >
                                                {format(token.expiryDate, "PPP")}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                            {token.pinCode ? (
                                                <Button variant={"outline"} size={"icon"} disabled>
                                                    <Lock className="w-4 h-4" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                {t("cancel")}
                            </Button>
                        </DialogClose>
                        <Button onClick={handleShareClick} className="w-full sm:w-auto">
                            {t("share")}
                        </Button>
                    </DialogFooter>
                </div>
            </>
        );
    };

    // Function to render the message view
    const renderMessageView = () => {
        return (
            <>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-base font-medium">{t("message.recipients") || "Recipients"}</Label>
                        <div className="flex flex-wrap gap-2">
                            {tokenList.slice(0, 4).map(token => (
                                <div key={token.email} className="bg-muted px-3 py-1 rounded-full text-sm">
                                    {token.email}
                                </div>
                            ))}
                            {tokenList.length > 4 && (
                                <div className="bg-muted px-3 py-1 rounded-full text-sm">+{tokenList.length - 4}</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-base font-medium">
                            {t("message.label") || "Add a message (optional)"}
                        </Label>
                        <textarea
                            className="w-full min-h-[150px] p-3 border rounded-md resize-none"
                            placeholder={
                                t("message.placeholder") || "Add a personal message to share with your contacts..."
                            }
                            value={shareMessage}
                            onChange={e => setShareMessage(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                    <Button variant="outline" onClick={handleBackToContacts} className="w-full sm:w-auto">
                        {t("message.back") || "Back"}
                    </Button>
                    {loadingShare ? (
                        <Button disabled className="w-full sm:w-auto">
                            <Loader2 className={"w-4 h-4 mr-2 animate-spin"} />{" "}
                            {t("message.sending") || "Sending emails"}
                        </Button>
                    ) : (
                        <Button onClick={submitSharePersonTokens} className="w-full sm:w-auto">
                            {t("message.send") || "Send"}
                        </Button>
                    )}
                </DialogFooter>
            </>
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                {!open && !setOpen ? (
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Share2 className="mr-2" /> {t("trigger")}
                        </Button>
                    </DialogTrigger>
                ) : null}
                <DialogContent
                    className={`sm:h-auto w-full max-w-full md:max-w-3xl overflow-auto`}
                    onPointerDownOutside={e => openExpiryDatePopover && e.preventDefault()}
                >
                    <motion.div
                        initial={false}
                        // animate={{
                        //     width: showMessageStep
                        //         ? '48rem'
                        //         : showPersonAccessTokenLock
                        //             ? '66rem'
                        //             : '48rem',
                        // }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="w-full"
                    >
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {showMessageStep ? (
                                    <div className="flex items-center gap-2">
                                        <ChevronLeft className="size-4 cursor-pointer" onClick={handleBackToContacts} />
                                        {t("title")}
                                    </div>
                                ) : (
                                    t("title")
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                {showMessageStep ? t("message.description") : t("description")}
                            </DialogDescription>
                        </DialogHeader>

                        <AnimatePresence mode="wait">
                            {!showMessageStep ? (
                                <motion.div
                                    key="share-view"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="w-full"
                                >
                                    {renderShareView()}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="message-view"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="w-full"
                                >
                                    {renderMessageView()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </DialogContent>
            </Dialog>
            <LockTokenDialog tokenId={lockToken?.id || ""} openState={openLockToken} setOpenState={setOpenLockToken} />
        </>
    );
};
