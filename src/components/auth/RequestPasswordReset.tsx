"use client";

import { RequestPasswordResetFormSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";

export default function RequestPasswordReset({
	locale,
	defaultEmail,
}: {
	readonly locale: string;
	readonly defaultEmail?: string;
}) {
	const t = useTranslations("components.auth.requestPasswordReset");

	const form = useForm<z.infer<typeof RequestPasswordResetFormSchema>>({
		resolver: zodResolver(RequestPasswordResetFormSchema),
		defaultValues: {
			email: defaultEmail || "",
		},
	});

	const submit = async ({ email }: z.infer<typeof RequestPasswordResetFormSchema>) => {
		await authClient.requestPasswordReset({
			email,
			redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/account/reset`,
			fetchOptions: {
				onError: () => {
					toast({
						title: t("errors.invalid-data.title"),
						description: t("errors.invalid-data.description"),
						variant: "destructive",
					});
				},
				onSuccess: () => {
					toast({
						title: t("success.title"),
						description: t("success.description"),
					});
				},
			},
		});
	};

	return (
		<Card className="max-w-lg">
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(submit)} className={"flex flex-col gap-4"}>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("form.email.label")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"form.email.placeholder"
											)}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="w-full flex flex-col gap-2 self-end">
							{form.formState.isSubmitting ? (
								<Button type="button" className="flex-1" disabled>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
									{t("actions.submitting")}
								</Button>
							) : (
								<Button type="submit" className="flex-1">
									{t("actions.submit")}
								</Button>
							)}
							<Button variant={"outline"} type="button" asChild>
								<Link href={`/${locale}/signin`}>
									{t("actions.backToLogin")}
								</Link>
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
