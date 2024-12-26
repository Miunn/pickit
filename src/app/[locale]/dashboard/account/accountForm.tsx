"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AccountFormSchema, ChangePasswordSchema, UserLight } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

export default function AccountForm({ user }: { user?: UserLight }) {

    const [loading, setLoading] = useState<boolean>(false);

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

    function submitAccount(data: z.infer<typeof AccountFormSchema>) {
        console.log(data);
    }

    function submitPassword(data: z.infer<typeof ChangePasswordSchema>) {
        console.log(data);
    }

    return (
        <>
            <Form {...accountFormSchema}>
                <form onSubmit={accountFormSchema.handleSubmit(submitAccount)} className="space-y-6 max-w-xl">
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
                                <FormDescription>Changing your email will require an updated verification</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {loading
                        ? <Button type="button" disabled={true}><Loader2 className={"mr-2 animate-spin"} /> Submiting</Button>
                        : <Button type="submit">Submit</Button>
                    }
                </form>
            </Form>

            <h4 className="font-semibold mt-10 mb-2">Change your password</h4>
            <Form {...passwordFormSchema}>
                <form onSubmit={passwordFormSchema.handleSubmit(submitPassword)} className="space-y-6 max-w-xl">
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

                    {loading
                        ? <Button type="button" disabled={true}><Loader2 className={"mr-2 animate-spin"} /> Submiting</Button>
                        : <Button type="submit">Submit</Button>
                    }
                </form>
            </Form>
        </>
    )
}