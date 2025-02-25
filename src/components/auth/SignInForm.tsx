"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInFormSchema } from "@/lib/definitions";
import { SignIn } from "@/actions/authActions";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { redirect } from "@/i18n/routing";

export default function SignInForm({ locale }: { locale: string }) {

    const t = useTranslations("components.auth.signIn");
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(SignInFormSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data: { email: string, password: string }) => {
        setLoading(true);
        
        const r = await SignIn(data.email, data.password);

        setLoading(false);

        console.log("r", r);
        
        if (r && r.error) {
            toast({
                title: t("form.error.title"),
                description: t("form.error.message"),
                variant: "destructive"
            });
            return;
        }

        router.push(`/${locale}/app`);
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
                                    <div className="flex justify-between">
                                        <FormLabel>{t('form.password')}</FormLabel>
                                        <Button variant={"link"} className="ml-auto p-0 h-fit focus-visible:ring-offset-2" asChild>
                                            <Link href={`/${locale}/account/forgot-password`} className="">{t('form.forgotPassword')}</Link>
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <Input placeholder={"••••••••••"} type={"password"} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {loading
                            ? <Button className={"ml-auto mr-0 flex"} type="submit" disabled><Loader2 className="animate-spin mr-2" /> {t('form.submitting')}</Button>
                            : <Button className={"block ml-auto mr-0"} type="submit"> {t('form.submit')}</Button>
                        }
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
