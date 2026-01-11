import { unlockAccessToken } from "@/actions/accessTokens";
import { AccessToken, FolderTokenPermission } from "@prisma/client";
import { Link, Lock, CalendarIcon, X, Eye, Pen } from "lucide-react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { CreatePersonAccessTokenFormSchema, FolderWithAccessToken } from "@/lib/definitions";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import LockTokenDialog from "@/components/folders/dialogs/LockTokenDialog";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import ShareTokenList from "./ShareTokenList";

interface ShareContactViewProps {
	readonly tokenList: {
		email: string;
		permission: FolderTokenPermission;
		expiryDate: Date;
		pinCode?: string;
		allowMap?: boolean;
	}[];
	readonly handleAddToken: (token: {
		email: string;
		permission: FolderTokenPermission;
		expiryDate: Date;
		pinCode?: string;
		allowMap?: boolean;
	}) => void;
	readonly handleRemoveToken: (email: string) => void;
	readonly folder: FolderWithAccessToken;
}

export default function ShareContactView({
	tokenList,
	handleAddToken,
	handleRemoveToken,
	folder,
}: ShareContactViewProps) {
	const locale = useLocale();
	const formatter = useFormatter();
	const t = useTranslations("dialogs.folders.share");
	const emailScroll = useRef<HTMLDivElement>(null);
	const folderTokens = useMemo(
		() =>
			folder.accessTokens
				.filter(token => token.expires > new Date() && token.isActive && !token.email)
				.sort((a, b) => a.permission.localeCompare(b.permission)),
		[folder]
	);
	const [openLockToken, setOpenLockToken] = useState(false);
	const [lockToken, setLockToken] = useState<AccessToken | null>(null);

	const sharePersonAccessTokenForm = useForm<z.infer<typeof CreatePersonAccessTokenFormSchema>>({
		resolver: zodResolver(CreatePersonAccessTokenFormSchema),
		defaultValues: {
			permission: FolderTokenPermission.READ,
			email: "",
			expiresAt: addMonths(new Date(), 3),
			allowMap: false,
		},
	});

	const addEmail = ({
		email,
		permission,
		expiresAt,
		pinCode,
		allowMap,
	}: z.infer<typeof CreatePersonAccessTokenFormSchema>) => {
		const emailSchema = z.string().email();
		if (
			!email ||
			email.length === 0 ||
			tokenList.map(t => t.email).includes(email) ||
			!emailSchema.safeParse(email).success
		) {
			toast({
				title: t("toast.emailAdd.error.title"),
				description: t("toast.emailAdd.error.description"),
				variant: "destructive",
			});
			return;
		}

		handleAddToken({ email, permission, expiryDate: expiresAt, pinCode, allowMap });
		sharePersonAccessTokenForm.reset();
	};

	useEffect(() => {
		if (!emailScroll.current) {
			return;
		}

		emailScroll.current!.scrollIntoView(false);
	}, [tokenList]);

	const handleLockToken = (token: AccessToken) => {
		setLockToken(token);
		setOpenLockToken(true);
	};

	const handleUnlockToken = async (tokenId: string) => {
		unlockAccessToken(tokenId);
	};

	return (
		<>
			<div className="flex flex-row justify-between items-center gap-2">
				<Label className="font-medium">{t("links.label")}</Label>
				<Button variant={"link"} className="pr-0 pl-0 sm:pl-2" asChild>
					<Link href={`/${locale}/app/links`}>{t("manageAccesses")}</Link>
				</Button>
			</div>
			<div
				className={
					"grid grid-cols-[0.3fr_1fr] sm:grid-cols-[0.3fr_1fr_auto] gap-3 items-center mb-4"
				}
			>
				{folderTokens.length > 0 ? (
					<ShareTokenList
						tokenList={folderTokens}
						handleUnlockToken={handleUnlockToken}
						handleLockToken={handleLockToken}
						folderId={folder.id}
					/>
				) : (
					<p className="col-span-1 sm:col-span-3 text-sm">{t("links.empty")}</p>
				)}
			</div>
			<Separator orientation={"horizontal"} className={"my-4"} />

			<div className="space-y-4">
				<Label className="font-medium">{t("people.title")}</Label>
				<Form {...sharePersonAccessTokenForm}>
					<form onSubmit={sharePersonAccessTokenForm.handleSubmit(addEmail)} className="">
						<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
							<div className="flex flex-col sm:flex-row gap-4 w-full">
								<FormField
									control={sharePersonAccessTokenForm.control}
									name={"permission"}
									render={({ field }) => (
										<FormItem className="flex flex-col sm:w-24">
											<FormLabel>
												{t(
													"people.form.permission.label"
												)}
											</FormLabel>
											<Select
												onValueChange={
													field.onChange
												}
												defaultValue={
													field.value
												}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"people.form.permission.placeholder"
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem
														value={
															FolderTokenPermission.READ
														}
													>
														{t(
															"people.form.permission.options.read"
														)}
													</SelectItem>
													<SelectItem
														value={
															FolderTokenPermission.WRITE
														}
													>
														{t(
															"people.form.permission.options.write"
														)}
													</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
								<FormField
									control={sharePersonAccessTokenForm.control}
									name={"email"}
									render={({ field }) => (
										<FormItem className="flex flex-col flex-1">
											<FormLabel>
												{t(
													"people.form.email.label"
												)}
											</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"people.form.email.placeholder"
													)}
													className=" mg:max-w-auto"
													{...field}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={sharePersonAccessTokenForm.control}
									name="expiresAt"
									render={({ field }) => (
										<FormItem className="flex flex-col sm:w-48">
											<FormLabel>
												{t(
													"people.form.expiryDate.label"
												)}
											</FormLabel>
											<Popover modal={true}>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={
																"outline"
															}
															className={cn(
																"text-left font-normal w-full",
																!field.value &&
																	"text-muted-foreground"
															)}
														>
															{field.value ? (
																formatter.dateTime(
																	field.value,
																	{
																		year: "numeric",
																		month: "long",
																		day: "numeric",
																	}
																)
															) : (
																<span>
																	Pick
																	a
																	date
																</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent
													className="w-auto p-0"
													align="start"
												>
													<Calendar
														mode="single"
														selected={
															field.value
														}
														onSelect={
															field.onChange
														}
														disabled={date =>
															date <
															new Date()
														}
														autoFocus
													/>
												</PopoverContent>
											</Popover>
										</FormItem>
									)}
								/>
							</div>

							<Button type="submit" className="w-full sm:w-auto">
								{t("buttons.emailAdd")}
							</Button>
						</div>

						<div className="flex flex-row gap-6">
							<Button
								type="button"
								variant={"link"}
								onClick={() =>
									sharePersonAccessTokenForm.setValue(
										"allowMap",
										!sharePersonAccessTokenForm.watch(
											"allowMap"
										)
									)
								}
								className="text-xs text-muted-foreground px-0 font-normal"
							>
								{t("people.form.allowMap.label")}{" "}
								{sharePersonAccessTokenForm.watch("allowMap")
									? t("people.form.allowMap.yes")
									: t("people.form.allowMap.no")}
							</Button>

							<Dialog>
								<DialogTrigger asChild>
									<Button
										type="button"
										variant={"link"}
										className="text-xs text-muted-foreground px-0 font-normal"
									>
										{t("people.form.pinCode.label")}{" "}
										{sharePersonAccessTokenForm.watch(
											"pinCode"
										)
											? t("people.form.pinCode.yes")
											: t("people.form.pinCode.no")}
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>
											{t(
												"people.form.pinCode.dialog.title"
											)}
										</DialogTitle>
										<DialogDescription>
											{t(
												"people.form.pinCode.dialog.description"
											)}
										</DialogDescription>
									</DialogHeader>
									<FormField
										control={
											sharePersonAccessTokenForm.control
										}
										name="pinCode"
										render={({ field }) => (
											<FormItem className={`mx-auto`}>
												<FormControl>
													<InputOTP
														maxLength={
															8
														}
														pattern={
															REGEXP_ONLY_DIGITS
														}
														{...field}
													>
														<InputOTPGroup>
															<InputOTPSlot
																index={
																	0
																}
															/>
															<InputOTPSlot
																index={
																	1
																}
															/>
															<InputOTPSlot
																index={
																	2
																}
															/>
															<InputOTPSlot
																index={
																	3
																}
															/>
														</InputOTPGroup>
														<InputOTPSeparator />
														<InputOTPGroup>
															<InputOTPSlot
																index={
																	4
																}
															/>
															<InputOTPSlot
																index={
																	5
																}
															/>
															<InputOTPSlot
																index={
																	6
																}
															/>
															<InputOTPSlot
																index={
																	7
																}
															/>
														</InputOTPGroup>
													</InputOTP>
												</FormControl>
											</FormItem>
										)}
									/>
									<DialogFooter>
										<DialogClose asChild>
											<Button
												type="button"
												variant={"ghost"}
											>
												{t(
													"people.form.pinCode.dialog.cancel"
												)}
											</Button>
										</DialogClose>
										<DialogClose asChild>
											<Button
												type="button"
												variant={"outline"}
												onClick={() =>
													sharePersonAccessTokenForm.setValue(
														"pinCode",
														undefined
													)
												}
											>
												{t(
													"people.form.pinCode.dialog.remove"
												)}
											</Button>
										</DialogClose>
										<DialogClose asChild>
											<Button
												type="button"
												onClick={() =>
													sharePersonAccessTokenForm.setValue(
														"pinCode",
														sharePersonAccessTokenForm.watch(
															"pinCode"
														)
													)
												}
											>
												{t(
													"people.form.pinCode.dialog.save"
												)}
											</Button>
										</DialogClose>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</form>
				</Form>
				<ScrollArea className={"max-h-32 md:max-h-40 border rounded-md p-2 w-full"}>
					<div ref={emailScroll} className="space-y-2">
						{tokenList.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-2">
								{t("people.empty") || "No contacts added yet"}
							</p>
						) : (
							tokenList.map(token => (
								<div
									key={token.email}
									className={
										"flex gap-2 p-2 rounded-md bg-muted/30"
									}
								>
									<div className="flex items-center gap-2">
										<Button
											onClick={() =>
												handleRemoveToken(
													token.email
												)
											}
											variant="ghost"
											size="icon"
											className="flexw-8 h-8"
										>
											<X
												className={
													"w-4 h-4 text-red-500"
												}
											/>
										</Button>
									</div>
									<Select value={token.permission} disabled>
										<SelectTrigger className="hidden sm:flex w-24">
											<SelectValue placeholder="Permission" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem
												value={
													FolderTokenPermission.READ
												}
											>
												{t(
													"people.form.permission.options.read"
												)}
											</SelectItem>
											<SelectItem
												value={
													FolderTokenPermission.WRITE
												}
											>
												{t(
													"people.form.permission.options.write"
												)}
											</SelectItem>
										</SelectContent>
									</Select>
									<div className="flex sm:hidden items-center">
										<Button
											variant="outline"
											size="icon"
											className="flex sm:hidden"
											disabled
										>
											{token.permission ===
											FolderTokenPermission.READ ? (
												<Eye className="w-4 h-4" />
											) : (
												<Pen className="w-4 h-4" />
											)}
										</Button>
									</div>
									<Input
										value={token.email}
										disabled={true}
										className="sm:w-fit sm:flex-1"
									/>
									<div className="hidden sm:flex items-center gap-2">
										<Button
											variant={"outline"}
											className={
												"text-left font-normal w-full sm:w-52"
											}
											disabled
										>
											{formatter.dateTime(
												token.expiryDate,
												{
													year: "numeric",
													month: "long",
													day: "numeric",
												}
											)}
											<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
										</Button>
										{token.pinCode ? (
											<Button
												variant={"outline"}
												size={"icon"}
												disabled
											>
												<Lock className="w-4 h-4" />
											</Button>
										) : null}
									</div>
								</div>
							))
						)}
					</div>
				</ScrollArea>
			</div>
			<LockTokenDialog
				tokenId={lockToken?.id || ""}
				openState={openLockToken}
				setOpenState={setOpenLockToken}
			/>
		</>
	);
}
