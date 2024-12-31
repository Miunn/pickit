"use client"

import { changePassword, requestVerificationEmail, updateUser } from "@/actions/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { AccountFormSchema, ChangePasswordSchema, UserLight } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

export default function AccountForm({ user }: { user?: UserLight }) {

    const [loadingInfos, setLoadingInfos] = useState<boolean>(false);
    const [newVerficiationLoading, setNewVerificationLoading] = useState<boolean>(false);
    const [loadingPassword, setLoadingPassword] = useState<boolean>(false);

    const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);

    const accountFormSchema = useForm<z.infer<typeof AccountFormSchema>>({
        resolver: zodResolver(AccountFormSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
        }
    })

    const passwordFormSchema = useForm<z.infer<typeof ChangePasswordSchema>>({
        resolver: zodResolver(ChangePasswordSchema),
        defaultValues: {
            oldPassword: '',
            newPassword: '',
            passwordConfirmation: '',
        }
    })

    async function submitAccount(data: z.infer<typeof AccountFormSchema>) {
        setLoadingInfos(true);

        const r = await updateUser(user!.id, data.name, data.email);

        setLoadingInfos(false);
        if (!r) {
            toast({
                title: "Error",
                description: "An error occured while updating your account",
                variant: "destructive"
            });
        }

        toast({
            title: "Account updated",
            description: "Your account has been updated successfully",
        });
    }

    async function requestNewVerificationEmail() {
        setNewVerificationLoading(true);
        const r = await requestVerificationEmail();
        setNewVerificationLoading(false);

        if (!r) {
            toast({
                title: "Error",
                description: "An error occured while requesting a new verification email",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Email sent",
            description: "A new verification email has been sent to your email address",
        });
    }

    async function submitPassword(data: z.infer<typeof ChangePasswordSchema>) {
        setLoadingPassword(true);

        const r = await changePassword(user!.id, data.oldPassword, data.newPassword);

        setLoadingPassword(false);

        if (!r) {
            toast({
                title: "Error",
                description: "An error occured while updating your password",
                variant: "destructive"
            });
            return;
        }

        if (r.error === "invalid-old") {
            toast({
                title: "Error",
                description: "Your old password is invalid",
                variant: "destructive"
            });
            return;
        }

        if (r.error === "user-not-found") {
            toast({
                title: "Error",
                description: "User not found",
                variant: "destructive"
            });
            return;
        }

        if (r.error) {
            toast({
                title: "Error",
                description: "An error occured while updating your password",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Password updated",
            description: "Your password has been updated successfully",
        });
    }

    return (
        <div>
            <Form  {...accountFormSchema}>
                <form onSubmit={accountFormSchema.handleSubmit(submitAccount)} className="space-y-6">
                    <FormField
                        control={accountFormSchema.control}
                        name="profilePicture"
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-4 space-y-0">
                                <FormControl>
                                    <Avatar className="h-24 w-24 rounded-lg cursor-pointer" onClick={() => console.log("Click avatar")} {...field}>
                                        <AvatarImage src={user?.image || undefined} alt={user?.name || undefined} className="hover:bg-gray-500" />
                                        <AvatarFallback className="rounded-lg transition-colors hover:bg-gray-200">{user?.name!.split(' ').map((token) => token[0]).join('').toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </FormControl>
                                <div>
                                    <FormLabel className="font-normal">
                                        Profile picture
                                    </FormLabel>
                                    <FormDescription>Custom your profile with a nice pic</FormDescription>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={accountFormSchema.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="font-normal">
                                    Full name
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={accountFormSchema.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="font-normal flex justify-between items-center">
                                    Change your email

                                    {user?.emailVerified ?
                                        <span className="text-green-600 flex items-center"><CircleCheck className="w-4 h-4 mr-1" /> Your email is verified</span>
                                        : <span className="text-yellow-600 flex items-center"><CircleAlert className="w-4 h-4 mr-1" /> Your email isn't verified</span>}
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="exemple@mail.com" {...field} />
                                </FormControl>
                                <FormDescription className="flex justify-between gap-2">
                                    <span>Changing your email will require an updated verification</span>
                                    {!user?.emailVerified
                                        ? <>
                                            {newVerficiationLoading
                                                ? <Button type="button" variant="link" className="text-muted-foreground p-0 h-fit text-[0.8rem] font-normal" disabled>
                                                    <Loader2 className={"w-4 h-4 mr-2 animate-spin"} />
                                                    Request a new email
                                                </Button>
                                                : <Button type="button" variant="link" className="text-muted-foreground p-0 h-fit text-[0.8rem] font-normal" onClick={requestNewVerificationEmail}>Request a new email</Button>
                                            }
                                        </>
                                        : null}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {loadingInfos
                        ? <Button type="button" disabled={true}><Loader2 className={"mr-2 animate-spin"} /> Submiting</Button>
                        : <Button type="button" onClick={() => {
                            // If email has changed from default value, trigger the dialog
                            if (accountFormSchema.getValues().email !== user?.email && user?.emailVerified === true) {
                                setOpenEmailDialog(true);
                            } else {
                                accountFormSchema.handleSubmit(submitAccount)();
                            }
                        }}>Submit</Button>
                    }
                </form>
            </Form>

            <h4 className="w-fit font-semibold mt-10 mb-2">Change your password</h4>
            <Form {...passwordFormSchema}>
                <form onSubmit={passwordFormSchema.handleSubmit(submitPassword)} className="space-y-6">
                    <FormField
                        control={passwordFormSchema.control}
                        name="oldPassword"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>Old password</FormLabel>
                                <FormControl>
                                    <FormControl>
                                        <Input placeholder="••••••••" type={"password"} {...field} />
                                    </FormControl>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordFormSchema.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>New password</FormLabel>
                                <FormControl>
                                    <FormControl>
                                        <Input placeholder="••••••••" type={"password"} {...field} />
                                    </FormControl>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordFormSchema.control}
                        name="passwordConfirmation"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>Confirm your new password</FormLabel>
                                <FormControl>
                                    <FormControl>
                                        <Input placeholder="••••••••" type={"password"} {...field} />
                                    </FormControl>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {loadingPassword
                        ? <Button type="button" disabled={true}><Loader2 className={"mr-2 animate-spin"} /> Submiting</Button>
                        : <Button type="submit">Submit</Button>
                    }
                </form>
            </Form>

            <Dialog open={openEmailDialog} onOpenChange={setOpenEmailDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change your email ?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to change your email ? You will need to verify your new email address.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild><Button variant={"outline"} onClick={() => {
                            setOpenEmailDialog(false);
                            accountFormSchema.setValue("email", user?.email);
                        }}>Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={() => {
                            setOpenEmailDialog(false);
                            accountFormSchema.handleSubmit(submitAccount)();
                        }}>Change email</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}