"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupFormSchema } from "@/lib/definitions";
import { toast } from "@/hooks/use-toast";
import { createUserHandler } from "@/actions/create";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ToastAction } from "../ui/toast";
import Link from "next/link";

export default function SignupForm({ locale }: { locale: string }) {

    const t = useTranslations('auth.signUp');
    const [loading, setLoading] = useState<boolean>(false);
    const form = useForm<z.infer<typeof SignupFormSchema>>({
        resolver: zodResolver(SignupFormSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            passwordConfirmation: '',
        }
    });

    const onSubmit = async (data: z.infer<typeof SignupFormSchema>) => {
        setLoading(true);

        const { name, email, password, passwordConfirmation } = data;
        const r = await createUserHandler({ name, email, password, passwordConfirmation });

        setLoading(false);

        if (r.status !== 'ok') {
            toast({
                title: "Error",
                description: r.message,
            });
            return;
        }

        toast({
            title: "Success",
            description: "Account created",
            action: <ToastAction altText="Login"><Link href={"/signin"}>Login</Link></ToastAction>
        });
    }

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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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

                        <FormField
                            control={form.control}
                            name="passwordConfirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.confirmPassword')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"••••••••••"} type={"password"} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {loading
                            ? <Button className={"ml-auto mr-0 flex"} type="button" disabled><Loader2 className="animate-spin mr-2" /> {t('form.submit')}</Button>
                            : <Button className={"block ml-auto mr-0"} type="submit">{t('form.submit')}</Button>
                        }
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
