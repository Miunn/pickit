"use client";

import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {SignInFormSchema} from "@/lib/definitions";
import {SignIn} from "@/actions/authActions";
import {useSearchParams} from "next/navigation";
import {useTranslations} from "next-intl";

export default function SignInForm({locale}) {

    const t = useTranslations("auth.signIn");
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const form = useForm({
        resolver: zodResolver(SignInFormSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data: { email: string, password: string }) => {
        SignIn({email: data.email, password: data.password, redirect: callbackUrl }).then(void 0);
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
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('form.email')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="exemple@mail.com" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('form.password')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"••••••••••"} type={"password"} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <Button className={"block ml-auto mr-0"} type="submit">{t('form.submit')}</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
