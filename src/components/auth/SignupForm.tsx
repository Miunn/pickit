"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupFormSchema } from "@/lib/definitions";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/navigation";

export default function SignupForm() {
	const router = useRouter();
	const t = useTranslations("components.auth.signUp");
	const form = useForm<z.infer<typeof SignupFormSchema>>({
		resolver: zodResolver(SignupFormSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			passwordConfirmation: "",
		},
	});

	const onSubmit = async ({ email, password, name }: z.infer<typeof SignupFormSchema>) => {
		const { error } = await authClient.signUp.email(
			{
				email, // user email address
				password, // user password -> min 8 characters by default
				name, // user display name
				callbackURL: "/app", // A URL to redirect to after the user verifies their email (optional)
			},
			{
				onSuccess: () => {
					//redirect to the dashboard or sign in page
					router.push(`/app`);
				},
				onError: ctx => {
					// display the error message
					toast({
						title: "Error",
						description: ctx.error.message,
					});
				},
			}
		);

		if (error?.code) {
			if (error?.code === "USER_ALREADY_EXISTS") {
				toast({
					title: t("form.error.email.title"),
					description: t("form.error.email.description"),
					variant: "destructive",
				});
				return;
			}

			toast({
				title: t("form.error.unknown.title"),
				description: t("form.error.unknown.description"),
				variant: "destructive",
			});
			return;
		}
	};

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
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("form.name")}</FormLabel>
									<FormControl>
										<Input
											placeholder="John Doe"
											{...field}
										/>
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
									<FormLabel>{t("form.email")}</FormLabel>
									<FormControl>
										<Input
											placeholder="example@mail.com"
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
									<FormLabel>{t("form.password")}</FormLabel>
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

						<FormField
							control={form.control}
							name="passwordConfirmation"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("form.confirmPassword")}
									</FormLabel>
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
							<Button className={"w-full flex"} type="button" disabled>
								<Loader2 className="animate-spin mr-2 size-4" />
								{t("form.submitting")}
							</Button>
						) : (
							<Button className={"w-full block"} type="submit">
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
				<Button variant={"outline"} className="w-full" asChild>
					<Link href={`/api/oauth/login/google`}>
						<FcGoogle className={"mr-2"} /> {t("google")}
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
