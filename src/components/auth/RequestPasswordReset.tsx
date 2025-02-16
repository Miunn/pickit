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
import { useTranslations } from "next-intl"
import { ToastAction } from "../ui/toast"

export default function RequestPasswordReset({ locale, defaultEmail }: { locale: string, defaultEmail?: string }) {

    const t = useTranslations('components.auth.requestPasswordReset');
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
            action: <ToastAction altText={"Login"}>
                <Button variant={"outline"}>Login</Button>
            </ToastAction>
        })

        setLoading(false);
    }

    return (
        <Card className="">
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className={"flex flex-col gap-4"}>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.email.label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('form.email.placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="w-full flex gap-2 self-end">
                        <Button variant={"outline"} type="button" asChild>
                            <Link href={`/${locale}/signin`}>{t('actions.backToLogin')}</Link>
                        </Button>
                        {loading
                            ? <Button type="button" className="flex-1" disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('actions.submitting')}</Button>
                            : <Button type="submit" className="flex-1">{t('actions.submit')}</Button>}
                            </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}