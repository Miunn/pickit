"use client";

import { ResetPasswordFormSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
	const t = useTranslations("components.auth.resetPasswordForm");
	const searchParams = useSearchParams();
	const router = useRouter();
	const locale = useLocale();

	const form = useForm<z.infer<typeof ResetPasswordFormSchema>>({
		resolver: zodResolver(ResetPasswordFormSchema),
		defaultValues: {
			password: "",
			passwordConfirmation: "",
		},
	});

	const submit = async ({ password }: z.infer<typeof ResetPasswordFormSchema>) => {
		const token = searchParams.get("token");

		if (!token) return;

		await authClient.resetPassword({
			newPassword: password,
			token,
			fetchOptions: {
				onError: () => {
					toast({
						title: t("errors.unknown.title"),
						description: t("errors.unknown.description"),
						variant: "destructive",
					});
				},
				onSuccess: () => {
					toast({
						title: t("success.title"),
						description: t("success.description"),
						action: (
							<ToastAction altText="Login">
								<Link href={`/${locale}/signin`}>
									{t("success.action")}
								</Link>
							</ToastAction>
						),
					});

					form.reset();

					router.push(`/${locale}/signin`);
				},
			},
		});
	};

	return (
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
									<FormLabel>
										{t("form.password.label")}
									</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder={t(
												"form.password.placeholder"
											)}
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
									<FormLabel>
										{t("form.confirmPassword.label")}
									</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder={t(
												"form.confirmPassword.placeholder"
											)}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{form.formState.isSubmitting ? (
							<Button type="button" className="self-end" disabled>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
								{t("actions.submitting")}
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
}
