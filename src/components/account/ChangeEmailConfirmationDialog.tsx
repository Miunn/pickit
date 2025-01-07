import React from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";

export default function ChangeEmailConfirmationDialog({ open, setOpen, onCancel, onSubmit }: { open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>, onCancel: () => void, onSubmit: () => void }) {

    const t = useTranslations("dialogs.account.changeEmailConfirmation")

    return (
        <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>{t('description')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild><Button variant={"outline"} onClick={onCancel}>{t('actions.cancel')}</Button></DialogClose>
                        <Button variant="destructive" onClick={onSubmit}>{t('actions.submit')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
    )
}