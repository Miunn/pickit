import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useState } from "react";
import { deleteAccessToken } from "@/actions/accessTokens";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DeleteAccessTokenDialog({ tokens, children, openState, setOpenState, submitNext }: { tokens: string[], children?: React.ReactNode, openState?: boolean, setOpenState?: React.Dispatch<React.SetStateAction<boolean>>, submitNext?: () => void }) {

    const t = useTranslations('dialogs.accessTokens.delete');
    const [loading, setLoading] = useState<boolean>(false);

    const submit = async () => {
        setLoading(true);

        const r = await deleteAccessToken(tokens);
        setLoading(false);

        if (r.error) {
            toast({
                title: t('errors.unknown.title'),
                description: t('errors.unknown.description'),
                variant: "destructive"
            });
            return;
        }

        setOpenState?.(false);

        submitNext?.();
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            {children}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title', { count: tokens.length })}</DialogTitle>
                    <DialogDescription>{t('description', { count: tokens.length })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('actions.cancel')}</Button>
                    </DialogClose>
                    {loading
                        ? <Button disabled={true} variant="destructive"><Loader2 className={"mr-2 animate-spin"} /> {t('actions.submitting')}</Button>
                        : <Button onClick={submit} variant="destructive">{t('actions.submit')}</Button>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}