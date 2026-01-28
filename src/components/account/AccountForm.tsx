"use client";

import { changePassword, sendVerificationEmail, updateUser } from "@/actions/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { AccountFormSchema, ChangePasswordSchema, UserLight } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ChangeEmailConfirmationDialog from "@/components/account/ChangeEmailConfirmationDialog";
import { useSearchParams } from "next/navigation";

export default function AccountForm({ user }: { readonly user: UserLight }) {
	const searchParams = useSearchParams();
	const t = useTranslations("components.account.accountForm");
	const [loadingInfos, setLoadingInfos] = useState<boolean>(false);
	const [newVerficiationLoading, setNewVerificationLoading] = useState<boolean>(false);
	const [loadingPassword, setLoadingPassword] = useState<boolean>(false);

	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);

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
			oldPassword: "",
			newPassword: "",
			passwordConfirmation: "",
		},
	});

	async function submitAccount(data: z.infer<typeof AccountFormSchema>) {
		setLoadingInfos(true);

		const r = await updateUser(user.id, data.name, data.email);

		setLoadingInfos(false);
		if (!r) {
			toast({
				title: "Error",
				description: "An error occured while updating your account",
				variant: "destructive",
			});
		}

		toast({
			title: "Account updated",
			description: "Your account has been updated successfully",
		});
	}

	async function requestNewVerificationEmail() {
		setNewVerificationLoading(true);
		const r = await sendVerificationEmail();
		setNewVerificationLoading(false);

		if (r.error) {
			if (r.error === "user-not-found") {
				toast({
					title: "Error",
					description: "User not found",
					variant: "destructive",
				});
				return;
			}

			if (r.error === "already-verified") {
				toast({
					title: "Error",
					description:
						"Your email is already verified. Refresh the page if status isn't updated",
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Error",
				description: "An error occured while requesting a new verification email",
				variant: "destructive",
			});
			return;
		}

		toast({
			title: "Email sent",
			description: "A new verification email has been sent to your email address",
		});
	}

	async function submitPassword(data: z.infer<typeof ChangePasswordSchema>) {
		setLoadingPassword(true);

		const r = await changePassword(user!.id, data.oldPassword, data.newPassword);

		setLoadingPassword(false);

		if (!r) {
			toast({
				title: "Error",
				description: "An error occured while updating your password",
				variant: "destructive",
			});
			return;
		}

		if (r.error === "invalid-old") {
			toast({
				title: "Error",
				description: "Your old password is invalid",
				variant: "destructive",
			});
			return;
		}

		if (r.error === "user-not-found") {
			toast({
				title: "Error",
				description: "User not found",
				variant: "destructive",
			});
			return;
		}

		if (r.error) {
			toast({
				title: "Error",
				description: "An error occured while updating your password",
				variant: "destructive",
			});
			return;
		}

		toast({
			title: "Password updated",
			description: "Your password has been updated successfully",
		});
	}

	useEffect(() => {
		if (searchParams.has("focus")) {
			const focus = searchParams.get("focus");
			if (focus === "email") {
				accountFormSchema.setFocus("email", { shouldSelect: true });
			} else if (focus === "password") {
				passwordFormSchema.setFocus("oldPassword");
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
													onClick={
														requestNewVerificationEmail
													}
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

					{loadingInfos ? (
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
						name="oldPassword"
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

					{loadingPassword ? (
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
