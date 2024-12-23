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
import { useTranslations } from "next-intl";
import { Share, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import React, { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccessToken } from "@prisma/client";
import { z } from "zod";
import { FolderWithAccessToken } from "@/lib/definitions";

export const ShareFolderDialog = ({ folder, open, setOpen }: { folder: FolderWithAccessToken, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) => {

    const [emailList, setEmailList] = useState<string[]>([]);
    const [email, setEmail] = useState<string>("");
    const emailScroll = useRef<HTMLDivElement>(null);
    const t = useTranslations("folders.dialog.share");

    const [readShareLink, setReadShareLink] = useState("");
    const [writeShareLink, setWriteShareLink] = useState("");

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

    useEffect(() => {
        setReadShareLink(`${window.location.origin}/dashboard/folders/${folder.id}?share=${folder.AccessToken.filter((token: AccessToken) => token.permission === "READ")[0].token}`);
        setWriteShareLink(`${window.location.origin}/dashboard/folders/${folder.id}?share=${folder.AccessToken.filter((token: AccessToken) => token.permission === "WRITE")[0].token}`);
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {open && setOpen ? <DialogTrigger asChild>
                <Button variant="outline">
                    <Share /> {t('trigger')}
                </Button>
            </DialogTrigger> : null}
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>

                <Label>{t('fields.link.label')}</Label>
                <div className={"grid gap-3 w-full items-center"} style={{
                    gridTemplateColumns: "0.5fr 1fr auto"
                }}>
                    <p className="text-sm text-nowrap">Read-only link</p>
                    <Input placeholder={t('fields.link.placeholder')} disabled={true}
                        value={readShareLink} />
                    <Button onClick={() => copyToClipboard(readShareLink)}>
                        {t('button.copy')}
                    </Button>
                    <p className="text-sm text-nowrap">Read and write link</p>
                    <Input placeholder={t('fields.link.placeholder')} disabled={true}
                        value={writeShareLink} />
                    <Button onClick={() => copyToClipboard(writeShareLink)}>
                        {t('button.copy')}
                    </Button>
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
                    <DialogClose>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button>Share</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
