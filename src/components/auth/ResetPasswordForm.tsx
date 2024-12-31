"use client"

import { ResetPasswordFormSchema } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { useState } from "react"
import { Loader2, MessageCircleQuestion } from "lucide-react"
import { resetPassword } from "@/actions/user"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "../ui/toast"
import Link from "next/link"

export default function ResetPasswordForm({ locale, token }: { locale: string, token: string | null }) {

    const [loading, setLoading] = useState<boolean>(false);

    const form = useForm<z.infer<typeof ResetPasswordFormSchema>>({
        resolver: zodResolver(ResetPasswordFormSchema),
        defaultValues: {
            password: "",
            passwordConfirmation: "",
        },
    });

    const submit = async (data: z.infer<typeof ResetPasswordFormSchema>) => {
        setLoading(true);
        
        const r = await resetPassword(token!, data.password);

        if (r.error) {
            toast({
                title: "Error",
                description: "An error occurred while resetting your password. Please try again.",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Success",
            description: "Your password has been reset successfully.",
            action: <ToastAction altText="Login"><Link href={`/${locale}/signin`}>Login</Link></ToastAction>
        });

        setLoading(false);
    }

    return (
        <>
            {token
                ? (
                    <Card className="w-96">
                        <CardHeader>
                            <CardTitle>Reset your password</CardTitle>
                            <CardDescription>Enter your new password</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(submit)} className={"flex flex-col gap-4"}>
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Password" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="passwordConfirmation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Confirm password" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {loading
                                        ? <Button type="button" className="self-end" disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reseting...</Button>
                                        : <Button type="submit" className="self-end">Reset</Button>}
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )
                : (
                    <div className="w-fit flex flex-col items-center gap-2">
                        <MessageCircleQuestion size={128} className="text-orange-600" />
                        <h1 className="text-center text-xl text-orange-600 font-bold">
                            This reset password link has expired or is invalid.
                        </h1>
                    </div>
                )
            }
        </>
    )
}