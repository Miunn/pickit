"use client";

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
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { ChevronLeft, Loader2, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { FolderWithAccessToken } from "@/lib/definitions";
import { FolderTokenPermission } from "@prisma/client";
import { createMultipleAccessTokens } from "@/actions/accessTokens";
import { motion, AnimatePresence } from "motion/react";
import ShareContactView from "@/components/share/ShareContactView";
import ShareMessageView from "@/components/share/ShareMessageView";

export const ShareFolderDialog = ({
	folder,
	open,
	setOpen,
}: {
	readonly folder: FolderWithAccessToken;
	readonly open?: boolean;
	readonly setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const t = useTranslations("dialogs.folders.share");
	const [loadingShare, setLoadingShare] = useState(false);
	const [tokenList, setTokenList] = useState<
		{
			email: string;
			permission: FolderTokenPermission;
			expiryDate: Date;
			pinCode?: string;
			allowMap?: boolean;
		}[]
	>([]);
	const [showMessageStep, setShowMessageStep] = useState(false);
	const [shareMessage, setShareMessage] = useState("");

	const submitSharePersonTokens = async () => {
		setLoadingShare(true);
		const r = await createMultipleAccessTokens(
			folder.id,
			tokenList.map(token => ({
				...token,
				message: shareMessage,
			}))
		);
		setLoadingShare(false);

		if (r.error) {
			toast({
				title: t("toast.submit.error.title"),
				description: t("toast.submit.error.description"),
				variant: "destructive",
			});
			return;
		}

		setTokenList([]);
		setShareMessage("");
		setShowMessageStep(false);

		toast({
			title: t("toast.submit.success.title"),
			description: t("toast.submit.success.description"),
		});

		if (setOpen) {
			setOpen(false);
		}
	};

	const handleAddToken = (token: {
		email: string;
		permission: FolderTokenPermission;
		expiryDate: Date;
		pinCode?: string;
	}) => {
		setTokenList(prev => [...prev, token]);
	};

	const handleRemoveToken = (email: string) => {
		setTokenList(prev => prev.filter(token => token.email !== email));
	};

	const handleShareClick = () => {
		if (tokenList.length === 0) {
			toast({
				title: t("toast.noContacts.title") || "No contacts",
				description:
					t("toast.noContacts.description") ||
					"Please add at least one contact before sharing",
				variant: "destructive",
			});
			return;
		}
		setShowMessageStep(true);
	};

	const handleBackToContacts = () => {
		setShowMessageStep(false);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				{!open && !setOpen ? (
					<DialogTrigger asChild>
						<Button variant="outline">
							<Share2 className="mr-2" /> {t("trigger")}
						</Button>
					</DialogTrigger>
				) : null}
				<DialogContent
					className={`sm:h-auto w-full max-w-full md:max-w-3xl overflow-auto`}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<motion.div
						initial={false}
						transition={{
							type: "spring",
							stiffness: 300,
							damping: 30,
						}}
						className="w-full"
					>
						<DialogHeader>
							<DialogTitle className="text-xl">
								{showMessageStep ? (
									<div className="flex items-center gap-2">
										<ChevronLeft
											className="size-4 cursor-pointer"
											onClick={handleBackToContacts}
										/>
										{t("title")}
									</div>
								) : (
									t("title")
								)}
							</DialogTitle>
							<DialogDescription className="text-sm">
								{showMessageStep
									? t("message.description")
									: t("description")}
							</DialogDescription>
						</DialogHeader>

						<AnimatePresence mode="wait">
							{showMessageStep ? (
								<motion.div
									key="message-view"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{
										duration: 0.3,
										ease: "easeInOut",
									}}
									className="w-full"
								>
									<ShareMessageView
										tokenList={tokenList}
										shareMessage={shareMessage}
										setShareMessage={setShareMessage}
									/>
									<DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
										<Button
											variant="outline"
											onClick={handleBackToContacts}
											className="w-full sm:w-auto"
										>
											{t("message.back") || "Back"}
										</Button>
										{loadingShare ? (
											<Button
												disabled
												className="w-full sm:w-auto"
											>
												<Loader2
													className={
														"w-4 h-4 mr-2 animate-spin"
													}
												/>{" "}
												{t("message.sending") ||
													"Sending emails"}
											</Button>
										) : (
											<Button
												onClick={
													submitSharePersonTokens
												}
												className="w-full sm:w-auto"
											>
												{t("message.send") ||
													"Send"}
											</Button>
										)}
									</DialogFooter>
								</motion.div>
							) : (
								<motion.div
									key="share-view"
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									transition={{
										duration: 0.3,
										ease: "easeInOut",
									}}
									className="w-full"
								>
									<ShareContactView
										tokenList={tokenList}
										handleAddToken={handleAddToken}
										handleRemoveToken={handleRemoveToken}
										folder={folder}
									/>
									<DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
										<DialogClose asChild>
											<Button
												variant="outline"
												className="w-full sm:w-auto"
											>
												{t("cancel")}
											</Button>
										</DialogClose>
										<Button
											onClick={handleShareClick}
											className="w-full sm:w-auto"
										>
											{t("share")}
										</Button>
									</DialogFooter>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</DialogContent>
			</Dialog>
		</>
	);
};
