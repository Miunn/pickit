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
import { lockFolder } from "@/actions/folders";
import { toast } from "@/hooks/use-toast";

export default function LockFolderDialog({ children, open, setOpen, folderId }: { children?: React.ReactNode, open?: boolean, setOpen?: React.Dispatch<React.SetStateAction<boolean>>, folderId: string }) {

    const [saveLoading, setSaveLoading] = useState<boolean>(false);

    const form = useForm<z.infer<typeof LockFolderFormSchema>>({
        resolver: zodResolver(LockFolderFormSchema),
        defaultValues: {
            pin: ''
        }
    })

    async function submit(data: z.infer<typeof LockFolderFormSchema>) {
        setSaveLoading(true);
        const r = await lockFolder(folderId, data.pin);
        setSaveLoading(false);

        if (r.error) {
            if (r.error === "invalid-pin") {
                form.setError("pin", {
                    type: "manual",
                    message: "Invalid PIN"
                })
            } else {
                toast({
                    title: "Error",
                    description: "An error occurred while locking the folder",
                    variant: "destructive"
                })
            }
            return;
        }

        toast({
            title: "Folder locked",
            description: "Your folder has been locked successfully"
        });

        if (setOpen) {
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                                        <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} {...field}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="mt-8 flex justify-end gap-2">
                            <DialogClose>
                                <Button type={"button"} variant={"outline"}>Cancel</Button>
                            </DialogClose>
                            {saveLoading
                                ? <Button type={"button"} disabled><Loader2 className={"w-4 h-4 mr-2"} /> Saving</Button>
                                : <Button type={"submit"}>Save</Button>}
                        </div>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    )
}