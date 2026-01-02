"use client";

import { ResetPasswordFormSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle, Loader2, MessageCircleQuestion } from "lucide-react";
import { resetPassword } from "@/actions/user";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "../ui/toast";
import { useTranslations } from "next-intl";
import { PasswordResetRequestStatus } from "@prisma/client";
import { Link, useRouter } from "@/i18n/navigation";

export default function ResetPasswordForm({
    locale,
    token,
    status,
}: {
    locale: string;
    token: string;
    status: PasswordResetRequestStatus;
}) {
    const t = useTranslations("components.auth.resetPasswordForm");
    const router = useRouter();

    const form = useForm<z.infer<typeof ResetPasswordFormSchema>>({
        resolver: zodResolver(ResetPasswordFormSchema),
        defaultValues: {
            password: "",
            passwordConfirmation: "",
        },
    });

    const submit = async (data: z.infer<typeof ResetPasswordFormSchema>) => {
        const r = await resetPassword(token, data.password);

        if (r.error) {
            toast({
                title: t("errors.unknown.title"),
                description: t("errors.unknown.description"),
                variant: "destructive",
            });
            return;
        }

        toast({
            title: t("success.title"),
            description: t("success.description"),
            action: (
                <ToastAction altText="Login">
                    <Link href={`/${locale}/signin`}>{t("success.action")}</Link>
                </ToastAction>
            ),
        });

        form.reset();

        router.refresh();
    };

    const renderForm = () => (
        <Card className="w-96">
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className={"flex flex-col gap-4"}>
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("form.password.label")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={t("form.password.placeholder")}
                                            {...field}
                                        />
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
                                    <FormLabel>{t("form.confirmPassword.label")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={t("form.confirmPassword.placeholder")}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.formState.isSubmitting ? (
                            <Button type="button" className="self-end" disabled>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("actions.submitting")}
                            </Button>
                        ) : (
                            <Button type="submit" className="self-end">
                                {t("actions.submit")}
                            </Button>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );

    const renderInvalid = () => (
        <div className="w-fit flex flex-col items-center gap-2">
            <MessageCircleQuestion size={128} className="text-orange-600" />
            <h1 className="text-center text-xl text-orange-600 font-bold">{t("invalid.title")}</h1>
        </div>
    );

    const renderSuccess = () => (
        <div className="w-fit flex flex-col items-center gap-2">
            <CheckCircle size={128} className="text-green-600" />
            <h1 className="text-center text-xl text-green-600 font-bold">{t("success.title")}</h1>
            <p className="text-center text-base text-green-600">{t("success.description")}</p>
            <Button variant={"link"} asChild>
                <Link href={"/signin"}>{t("success.actionLong")}</Link>
            </Button>
        </div>
    );

    if (status === PasswordResetRequestStatus.SUCCESS) {
        return renderSuccess();
    }

    if (status === PasswordResetRequestStatus.PENDING) {
        return renderForm();
    }

    return renderInvalid();
}
