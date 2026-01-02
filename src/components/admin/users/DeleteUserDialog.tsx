import { deleteUser } from "@/actions/userAdministration";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { UserLight } from "@/lib/definitions";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

export interface DeleteUserDialogProps {
    readonly children?: React.ReactNode;
    readonly open: boolean;
    readonly setOpen: (open: boolean) => void;
    readonly user: UserLight;
}

export default function DeleteUserDialog({ children, open, setOpen, user }: DeleteUserDialogProps) {
    const t = useTranslations("dialogs.admin.users.delete");
    const [loading, setLoading] = React.useState(false);
    const [confirmation, setConfirmation] = React.useState<string>("");

    const onDelete = async () => {
        setLoading(true);

        const r = await deleteUser(user.id);

        setLoading(false);

        if (r) {
            toast({
                title: t("success.title"),
                description: t("success.description"),
            });

            if (setOpen) {
                setOpen(false);
            }
        } else {
            toast({
                title: t("errors.unknown.title"),
                description: t("errors.unknown.description"),
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={open => {
                setConfirmation("");
                if (setOpen) {
                    setOpen(open);
                }
            }}
        >
            {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title", { name: user.name })}</DialogTitle>
                    <DialogDescription>{t("description", { name: user.name })}</DialogDescription>
                </DialogHeader>

                <Label>{t("confirmation.label")}</Label>
                <Input
                    placeholder={t("confirmation.placeholder", { name: user.name })}
                    onChange={e => setConfirmation(e.currentTarget.value)}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={"outline"}>{t("actions.cancel")}</Button>
                    </DialogClose>
                    {loading ? (
                        <Button variant={"destructive"} disabled>
                            <Loader2 className="animate-spin" /> {t("actions.submitting")}
                        </Button>
                    ) : (
                        <Button variant={"destructive"} disabled={confirmation !== user.name} onClick={onDelete}>
                            {t("actions.submit")}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
