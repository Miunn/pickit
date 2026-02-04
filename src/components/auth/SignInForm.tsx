"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInFormSchema } from "@/lib/definitions";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { useE2EEncryptionContext } from "@/context/E2EEncryptionContext";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";

export default function SignInForm() {
	const locale = useLocale();
	const t = useTranslations("components.auth.signIn");
	const searchParams = useSearchParams();
	const { loadKeys } = useE2EEncryptionContext();

	const form = useForm({
		resolver: zodResolver(SignInFormSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async ({ email, password }: z.infer<typeof SignInFormSchema>) => {
		const { error } = await authClient.signIn.email({
			email,
			password,
			rememberMe: true,
			callbackURL: `/${locale}/app`,
		});

		if (error?.code) {
			toast({
				title: t("form.error.title"),
				description: t("form.error.message"),
				variant: "destructive",
			});
			return;
		}

		await loadKeys(password);
	};

	const displayParamsErrorToast = useCallback(() => {
		if (searchParams.get("error")) {
			toast({
				title: t(`errors.${searchParams.get("error")}.title`),
				description: t(`errors.${searchParams.get("error")}.description`),
				variant: "destructive",
			});
		}
	}, [searchParams, t]);

	useEffect(() => {
		displayParamsErrorToast();
	}, [displayParamsErrorToast]);

	return (
		<Card className={"w-96"}>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className={"space-y-4"}>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("form.email")}</FormLabel>
									<FormControl>
										<Input
											placeholder="exemple@mail.com"
											{...field}
										/>
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
										<FormLabel>
											{t("form.password")}
										</FormLabel>
										<Button
											variant={"link"}
											className="ml-auto p-0 h-fit focus-visible:ring-offset-2"
											asChild
										>
											<Link
												href={`/${locale}/account/forgot-password`}
												className=""
											>
												{t(
													"form.forgotPassword"
												)}
											</Link>
										</Button>
									</div>
									<FormControl>
										<Input
											placeholder={"••••••••••"}
											type={"password"}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{form.formState.isSubmitting ? (
							<Button className={"w-full flex"} type="submit" disabled>
								<Loader2 className="animate-spin mr-2 size-4" />{" "}
								{t("form.submitting")}
							</Button>
						) : (
							<Button className={"w-full block"} type="submit">
								{" "}
								{t("form.submit")}
							</Button>
						)}
					</form>
				</Form>
				<div className="relative text-center text-sm my-4 after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
					<span className="relative z-10 bg-background px-2 text-muted-foreground">
						{t("or")}
					</span>
				</div>
				<Button
					variant={"outline"}
					className="w-full"
					onClick={() => {
						authClient.signIn.social({
							provider: "google",
							callbackURL: `/${locale}/app`,
						});
					}}
				>
					<FcGoogle className={"mr-2"} /> {t("google")}
				</Button>
			</CardContent>
		</Card>
	);
}
