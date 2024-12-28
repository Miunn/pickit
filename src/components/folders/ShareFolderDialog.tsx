"use client"

import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { Share2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { FolderWithAccessToken } from "@/lib/definitions";
import Link from "next/link";

export const ShareFolderDialog = ({ folder, open, setOpen }: { folder: FolderWithAccessToken, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const locale = useLocale();
    const [emailList, setEmailList] = useState<string[]>([]);
    const [email, setEmail] = useState<string>("");
    const emailScroll = useRef<HTMLDivElement>(null);
    const t = useTranslations("folders.dialog.share");
    const validTokens = folder.AccessToken.filter((token) => token.expires > new Date() && token.isActive);

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

    const addEmail = (email: string) => {
        const emailSchema = z.string().email();
        if (!email || email.length === 0 || emailList.includes(email) || !emailSchema.safeParse(email).success) {
            toast({
                title: t('fields.email.error.title'),
                description: t('fields.email.error.description'),
                variant: "destructive"
            })
            return;
        }
        setEmailList([...emailList, email]);
        setEmail("");
    }

    useEffect(() => {
        if (!emailScroll.current) {
            return;
        }

        emailScroll.current!.scrollIntoView(false);
    }, [emailList]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!open && !setOpen ? <DialogTrigger asChild>
                <Button variant="outline">
                    <Share2 className="mr-2" /> {t('trigger')}
                </Button>
            </DialogTrigger> : null}
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>

                <div className="flex justify-between items-center">
                    <Label>{t('fields.link.label')}</Label>
                    <Button variant={"link"}>
                        <Link href={`/${locale}/dashboard/links`}>
                            Manage accesses
                        </Link>
                    </Button>
                </div>
                <div className={"grid gap-3 w-full items-center"} style={{
                    gridTemplateColumns: "0.5fr 1fr auto"
                }}>
                    {validTokens.length > 0
                        ? validTokens.sort((a, b) => a.permission.localeCompare(b.permission)).map((token) => <Fragment key={token.token}>
                            <Label>{token.permission}</Label>
                            <Input placeholder={t('fields.link.placeholder')} disabled={true}
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/folders/${folder.id}?share=${token.token}`} />

                            <Button onClick={() => copyToClipboard(token.token)} className="text-start">
                                {t('button.copy')}
                            </Button>
                        </Fragment>)
                        : null}
                </div>
                <Separator orientation={"horizontal"} className={"my-4"} />

                <Label htmlFor={"share-email"}>{t('fields.email.label')}</Label>
                <div className={"flex gap-3 w-full"}>
                    <Input id={"share-email"} placeholder={t('fields.email.placeholder')} value={email}
                        onChange={(v) => setEmail(v.currentTarget.value)} />
                    <Button onClick={() => addEmail(email)}>
                        {t('button.emailAdd')}
                    </Button>
                </div>
                <ScrollArea className={"max-h-40"}>
                    <div ref={emailScroll}>
                        {emailList.map((email: string) => (
                            <div key={email} className={"flex gap-1 w-full my-1"}>
                                <Button onClick={() => setEmailList(emailList.filter((e) => e !== email))} variant="ghost" size="icon">
                                    <X className={"w-4 h-4 text-red-500"} />
                                </Button>
                                <Input value={email} disabled={true} />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button>Share</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
