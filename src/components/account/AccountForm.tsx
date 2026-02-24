"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { AccountFormSchema, ChangePasswordSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ChangeEmailConfirmationDialog from "@/components/account/ChangeEmailConfirmationDialog";
import { useSearchParams } from "next/navigation";
import { User } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

export default function AccountForm({ user }: { readonly user: User }) {
	const searchParams = useSearchParams();
	const t = useTranslations("components.account.accountForm");
	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);
	const [newVerficiationLoading, setNewVerficiationLoading] = useState<boolean>(false);

	const accountFormSchema = useForm<z.infer<typeof AccountFormSchema>>({
		resolver: zodResolver(AccountFormSchema),
		defaultValues: {
			name: user.name || "",
			email: user.email || "",
		},
	});

	const passwordFormSchema = useForm<z.infer<typeof ChangePasswordSchema>>({
		resolver: zodResolver(ChangePasswordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			passwordConfirmation: "",
		},
	});

	async function submitAccount({ name, email }: z.infer<typeof AccountFormSchema>) {
		if (name && name !== user.name) {
			await authClient.updateUser({
				name,
				fetchOptions: {
					onError: () => {
						toast({
							title: "Error",
							description: "An error occured while updating your account",
							variant: "destructive",
						});
					},
					onSuccess: () => {
						toast({
							title: "Account updated",
							description: "Your account has been updated successfully",
						});
					},
				},
			});
		}

		if (email && email !== user.email) {
			await authClient.changeEmail({
				newEmail: email,
				callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
				fetchOptions: {
					onError: () => {
						toast({
							title: "Error",
							description: "An error occured while updating your email",
							variant: "destructive",
						});
					},
					onSuccess: () => {
						toast({
							title: "Email change requested",
							description:
								"An email has been sent to your new address to confirm the change",
						});
					},
				},
			});
		}
	}

	async function submitPassword({ currentPassword, newPassword }: z.infer<typeof ChangePasswordSchema>) {
		await authClient.changePassword({
			currentPassword,
			newPassword,
			fetchOptions: {
				onError: () => {
					toast({
						title: "Error",
						description: "An error occured while updating your password",
						variant: "destructive",
					});
				},
				onSuccess: () => {
					toast({
						title: "Password updated",
						description: "Your password has been updated successfully",
					});

					passwordFormSchema.reset();
				},
			},
		});
	}

	useEffect(() => {
		if (searchParams.has("focus")) {
			const focus = searchParams.get("focus");
			if (focus === "email") {
				accountFormSchema.setFocus("email", { shouldSelect: true });
			} else if (focus === "password") {
				passwordFormSchema.setFocus("currentPassword");
			}
		}
	});

	return (
		<div>
			<Form {...accountFormSchema}>
				<form onSubmit={accountFormSchema.handleSubmit(submitAccount)} className="space-y-6">
					<FormField
						control={accountFormSchema.control}
						name="profilePicture"
						render={({ field }) => (
							<FormItem className="flex items-center space-x-4 space-y-0">
								<FormControl>
									<Avatar
										className="h-24 w-24 rounded-lg cursor-pointer"
										onClick={() =>
											console.log("Click avatar")
										}
										{...field}
									>
										<AvatarImage
											src={user.image || undefined}
											alt={user.name}
											className="hover:bg-gray-500"
										/>
										<AvatarFallback className="rounded-lg transition-colors hover:bg-gray-200">
											{user.name
												.split(" ")
												.map(token => token[0])
												.join("")
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</FormControl>
								<div>
									<FormLabel className="font-normal">
										{t("form.profilePicture.label")}
									</FormLabel>
									<FormDescription>
										{t("form.profilePicture.description")}
									</FormDescription>
									<FormMessage />
								</div>
							</FormItem>
						)}
					/>
					<FormField
						control={accountFormSchema.control}
						name="name"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="font-normal">
									{t("form.name.label")}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={t("form.name.placeholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={accountFormSchema.control}
						name="email"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="font-normal flex justify-between items-center">
									{t("form.email.label")}

									{user.emailVerified ? (
										<span className="text-green-600 flex items-center">
											<CircleCheck className="w-4 h-4 mr-1" />{" "}
											{t("form.email.verified")}
										</span>
									) : (
										<span className="text-yellow-600 flex items-center">
											<CircleAlert className="w-4 h-4 mr-1" />{" "}
											{t("form.email.unverified")}
										</span>
									)}
								</FormLabel>
								<FormControl>
									<Input
										placeholder="exemple@mail.com"
										{...field}
									/>
								</FormControl>
								<FormDescription className="flex justify-between gap-2">
									<span>{t("form.email.warning")}</span>
									{user.emailVerified ? null : (
										<>
											{newVerficiationLoading ? (
												<Button
													type="button"
													variant="link"
													className="text-muted-foreground p-0 h-fit text-[0.8rem] font-normal"
													disabled
												>
													<Loader2
														className={
															"w-4 h-4 mr-2 animate-spin"
														}
													/>
													{t(
														"form.email.requestVerification"
													)}
												</Button>
											) : (
												<Button
													type="button"
													variant="link"
													className="text-muted-foreground p-0 h-fit text-[0.8rem] font-normal"
													onClick={() => {
														setNewVerficiationLoading(
															true
														);
														setTimeout(
															() => {
																setNewVerficiationLoading(
																	false
																);
															},
															2500
														);
														authClient.sendVerificationEmail(
															{
																email: user.email,
																callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/app`, // The redirect URL after verification
															}
														);
													}}
												>
													{t(
														"form.email.requestVerification"
													)}
												</Button>
											)}
										</>
									)}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{accountFormSchema.formState.isSubmitting ? (
						<Button type="button" disabled={true}>
							<Loader2 className={"mr-2 animate-spin"} />{" "}
							{t("form.actions.submitting")}
						</Button>
					) : (
						<Button
							type="button"
							onClick={() => {
								// If email has changed from default value, trigger the dialog
								if (
									accountFormSchema.getValues().email !==
										user.email &&
									user.emailVerified === true
								) {
									setOpenEmailDialog(true);
								} else {
									accountFormSchema.handleSubmit(submitAccount)();
								}
							}}
						>
							{t("form.actions.submit")}
						</Button>
					)}
				</form>
			</Form>

			<h4 className="w-fit font-semibold mt-10 mb-2">{t("passwordForm.title")}</h4>
			<Form {...passwordFormSchema}>
				<form onSubmit={passwordFormSchema.handleSubmit(submitPassword)} className="space-y-6">
					<FormField
						control={passwordFormSchema.control}
						name="currentPassword"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>
									{t("passwordForm.currentPassword.label")}
								</FormLabel>
								<FormControl>
									<FormControl>
										<Input
											placeholder={t(
												"passwordForm.newPassword.placeholder"
											)}
											type={"password"}
											{...field}
										/>
									</FormControl>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={passwordFormSchema.control}
						name="newPassword"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>
									{t("passwordForm.newPassword.label")}
								</FormLabel>
								<FormControl>
									<FormControl>
										<Input
											placeholder={t(
												"passwordForm.newPassword.placeholder"
											)}
											type={"password"}
											{...field}
										/>
									</FormControl>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={passwordFormSchema.control}
						name="passwordConfirmation"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>
									{t("passwordForm.confirmPassword.label")}
								</FormLabel>
								<FormControl>
									<FormControl>
										<Input
											placeholder={t(
												"passwordForm.confirmPassword.placeholder"
											)}
											type={"password"}
											{...field}
										/>
									</FormControl>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{passwordFormSchema.formState.isSubmitting ? (
						<Button type="button" disabled={true}>
							<Loader2 className={"mr-2 animate-spin"} />{" "}
							{t("passwordForm.actions.submitting")}
						</Button>
					) : (
						<Button type="submit">{t("passwordForm.actions.submit")}</Button>
					)}
				</form>
			</Form>

			<ChangeEmailConfirmationDialog
				open={openEmailDialog}
				setOpen={setOpenEmailDialog}
				onCancel={() => {
					setOpenEmailDialog(false);
					accountFormSchema.setValue("email", user.email);
				}}
				onSubmit={() => {
					setOpenEmailDialog(false);
					accountFormSchema.handleSubmit(submitAccount)();
				}}
			/>
		</div>
	);
}
