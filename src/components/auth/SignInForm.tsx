"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInFormSchema } from "@/lib/definitions";
import { SignIn } from "@/actions/authActions";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SignInForm({ locale }: { locale: string }) {

    const t = useTranslations("auth.signIn");
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState<boolean>(false);
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const form = useForm({
        resolver: zodResolver(SignInFormSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data: { email: string, password: string }) => {
        setLoading(true);
        const r = await SignIn({ email: data.email, password: data.password, redirect: callbackUrl });
        /*console.log("Result:", r)
        if (r === null) {
            toast({
                title: t("form.error.title"),
                description: t("form.error.message")
            });
        }*/

        setLoading(false);
    };

    return (
        <Card className={"w-96"}>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className={"space-y-4"}>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.email')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="exemple@mail.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.password')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"••••••••••"} type={"password"} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {loading
                            ? <Button className={"ml-auto mr-0 flex"} type="submit" disabled><Loader2 className="animate-spin mr-2" /> {t('form.submit')}</Button>
                            : <Button className={"block ml-auto mr-0"} type="submit"> {t('form.submit')}</Button>
                        }
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
