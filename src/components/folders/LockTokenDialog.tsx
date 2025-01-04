import { z } from "zod";
import { LockFolderFormSchema } from "@/lib/definitions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { lockAccessToken } from "@/actions/accessTokens";
import { lockPersonAccessToken } from "@/actions/accessTokensPerson";

export default function LockTokenDialog({ children, openState, setOpenState, tokenId, tokenType }: { children?: React.ReactNode, openState?: boolean, setOpenState?: React.Dispatch<React.SetStateAction<boolean>>, tokenId: string, tokenType: "accessToken" | "personAccessToken" }) {

    const [saveLoading, setSaveLoading] = useState<boolean>(false);

    const form = useForm<z.infer<typeof LockFolderFormSchema>>({
        resolver: zodResolver(LockFolderFormSchema),
        defaultValues: {
            pin: ''
        }
    })

    async function submit(data: z.infer<typeof LockFolderFormSchema>) {
        setSaveLoading(true);
        let r;
        if (tokenType === "accessToken") {
            r = await lockAccessToken(tokenId, data.pin);
        } else if (tokenType === "personAccessToken") {
            r = await lockPersonAccessToken(tokenId, data.pin);
        } else {
            setSaveLoading(false);
            toast({
                title: "Error",
                description: "Wrong token type",
            });
            return;
        }
        setSaveLoading(false);

        if (r.error) {
            toast({
                title: "Error",
                description: "An error occurred while locking the folder",
            });
            return;
        }

        toast({
            title: "Folder locked",
            description: "Your folder has been locked successfully"
        });

        if (setOpenState) {
            setOpenState(false);
        }
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            {children}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lock Folder</DialogTitle>
                    <DialogDescription>Lock your folder with a personal code</DialogDescription>
                </DialogHeader>


                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className="w-full">
                        <FormField
                            control={form.control}
                            name="pin"
                            render={({ field }) => (
                                <FormItem className="w-fit mx-auto">
                                    <FormLabel>PIN Code</FormLabel>
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
                                <Button type={"button"} variant={"outline"}>Cancel</Button>
                            </DialogClose>
                            {saveLoading
                                ? <Button type={"button"} disabled><Loader2 className={"w-4 h-4 mr-2 animate-spin"} /> Saving</Button>
                                : <Button type={"submit"}>Save</Button>}
                        </div>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    )
}