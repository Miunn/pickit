"use client";

import { LockFolderFormSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { z } from "zod";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { useRouter } from "@/i18n/navigation";
import bcrypt from "bcryptjs";
import { useSearchParams } from "next/navigation";

export default function UnlockTokenPrompt({
	folderId,
	wrongPin,
}: {
	readonly folderId: string;
	readonly wrongPin?: boolean;
}) {
	const searchParams = useSearchParams();
	const shareToken = searchParams.get("share");

	const t = useTranslations("components.accessTokens.unlock");
	const router = useRouter();

	const form = useForm<z.infer<typeof LockFolderFormSchema>>({
		resolver: zodResolver(LockFolderFormSchema),
		defaultValues: {
			pin: "",
		},
	});

	const onUnlock = async (data: z.infer<typeof LockFolderFormSchema>) => {
		let hashedPin;
		if (data.pin) {
			const salt = await bcrypt.genSalt(10);
			hashedPin = await bcrypt.hash(data.pin, salt);
		}

		router.push(`/app/folders/${folderId}?share=${shareToken}&h=${hashedPin}`);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onUnlock)}
				className="w-fit h-full mx-auto flex flex-col justify-center gap-6"
			>
				<FormField
					control={form.control}
					name="pin"
					render={({ field }) => (
						<FormItem className="w-fit mx-auto">
							<FormLabel className="text-xl">{t("form.pin.label")}</FormLabel>
							<FormControl>
								<InputOTP
									maxLength={8}
									pattern={REGEXP_ONLY_DIGITS}
									className="text-xl"
									{...field}
								>
									<InputOTPGroup>
										<InputOTPSlot
											index={0}
											className="w-16 h-16 text-3xl"
										/>
										<InputOTPSlot
											index={1}
											className="w-16 h-16 text-3xl"
										/>
										<InputOTPSlot
											index={2}
											className="w-16 h-16 text-3xl"
										/>
										<InputOTPSlot
											index={3}
											className="w-16 h-16 text-3xl"
										/>
									</InputOTPGroup>
									<InputOTPSeparator />
									<InputOTPGroup>
										<InputOTPSlot
											index={4}
											className="w-16 h-16 text-3xl"
										/>
										<InputOTPSlot
											index={5}
											className="w-16 h-16 text-3xl"
										/>
										<InputOTPSlot
											index={6}
											className="w-16 h-16 text-3xl"
										/>
										<InputOTPSlot
											index={7}
											className="w-16 h-16 text-3xl"
										/>
									</InputOTPGroup>
								</InputOTP>
							</FormControl>
							<FormDescription>{t("form.pin.description")}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-between items-center">
					<p className="text-destructive text-sm font-semibold">
						{wrongPin ? t("errors.unauthorized.description") : null}
					</p>
					{form.formState.isSubmitting ? (
						<Button type={"button"} className="self-end" disabled>
							<Loader2 className={"w-4 h-4 mr-2 animate-spin"} />{" "}
							{t("actions.submitting")}
						</Button>
					) : (
						<Button type={"submit"} className="self-end">
							{t("actions.submit")}
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}
