import { z } from "zod";
import { LockFolderFormSchema } from "@/lib/definitions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../ui/form";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../../ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { lockAccessToken } from "@/actions/accessTokens";
import { useTranslations } from "next-intl";

export default function LockTokenDialog({ children, openState, setOpenState, tokenId }: { readonly children?: React.ReactNode, readonly openState?: boolean, readonly setOpenState?: React.Dispatch<React.SetStateAction<boolean>>, readonly tokenId: string }) {

    const t = useTranslations("dialogs.accessTokens.lockToken");
    const [saveLoading, setSaveLoading] = useState<boolean>(false);

    const form = useForm<z.infer<typeof LockFolderFormSchema>>({
        resolver: zodResolver(LockFolderFormSchema),
        defaultValues: {
            pin: ''
        }
    })

    async function submit(data: z.infer<typeof LockFolderFormSchema>) {
        setSaveLoading(true);
        const r = await lockAccessToken(tokenId, data.pin);

        setSaveLoading(false);

        if (r.error) {
            toast({
                title: t('errors.unknown.title'),
                description: t('errors.unknown.description'),
            });
            return;
        }

        toast({
            title: t('success.title'),
            description: t('success.description'),
        });

        setOpenState?.(false);
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            {children}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description')}</DialogDescription>
                </DialogHeader>


                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className="w-full">
                        <FormField
                            control={form.control}
                            name="pin"
                            render={({ field }) => (
                                <FormItem className="w-fit mx-auto">
                                    <FormLabel>{t('form.pin.label')}</FormLabel>
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

                        <div className="mt-8 flex justify-end gap-2">
                            <DialogClose asChild>
                                <Button type={"button"} variant={"outline"}>{t('actions.cancel')}</Button>
                            </DialogClose>
                            {saveLoading
                                ? <Button type={"button"} disabled><Loader2 className={"w-4 h-4 mr-2 animate-spin"} /> {t('actions.submitting')}</Button>
                                : <Button type={"submit"}>{t('actions.submit')}</Button>}
                        </div>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    )
}