"use client"

import { RequestPasswordResetFormSchema } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { requestPasswordReset } from "@/actions/user"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function RequestPasswordReset({ locale, defaultEmail }: { locale: string, defaultEmail?: string }) {

    const [loading, setLoading] = useState<boolean>(false);

    const form = useForm<z.infer<typeof RequestPasswordResetFormSchema>>({
        resolver: zodResolver(RequestPasswordResetFormSchema),
        defaultValues: {
            email: defaultEmail || "",
        },
    });

    const submit = (data: z.infer<typeof RequestPasswordResetFormSchema>) => {
        setLoading(true);
        
        // Just send the request, don't wait for a response since we don't want to leak information about the user
        requestPasswordReset(data.email);

        toast({
            title: "Password reset requested",
            description: "If the email is associated to an account, you will receive an email with further instructions",
        })

        setLoading(false);
    }

    return (
        <Card className="w-96">
            <CardHeader>
                <CardTitle>Request a new password</CardTitle>
                <CardDescription>Enter the email associated to your account</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className={"flex flex-col gap-4"}>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 self-end">
                        <Button variant={"outline"} type="button" asChild>
                            <Link href={`/${locale}/signin`}>Back to login</Link>
                        </Button>
                        {loading
                            ? <Button type="button" disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Requesting...</Button>
                            : <Button type="submit">Request a password reset</Button>}
                            </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}