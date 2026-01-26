import { AccessToken, FolderTokenPermission } from "@prisma/client";
import { Button } from "../ui/button";
import { Fragment } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useTranslations } from "next-intl";
import { toast } from "@/hooks/use-toast";
import { FolderWithLastSlug } from "@/lib/definitions";

export default function ShareTokenList({
	tokenList,
}: {
	readonly tokenList: (AccessToken & { folder: FolderWithLastSlug })[];
}) {
	const t = useTranslations("dialogs.folders.share");

	const copyToClipboard = (link: string) => {
		navigator.clipboard
			.writeText(link)
			.then(() => {
				toast({
					title: t("toast.copy.success.title"),
					description: t("toast.copy.success.description"),
				});
			})
			.catch(() => {
				toast({
					title: t("toast.copy.error.title"),
					description: t("toast.copy.error.description"),
					variant: "destructive",
				});
			});
	};

	return (
		<>
			{tokenList.map(token => {
				const lastSlug = token.folder.slugs.sort(
					(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
				)[0];
				return (
					<Fragment key={token.token}>
						<Label className="capitalize text-sm">
							{token.permission === FolderTokenPermission.READ
								? t("links.link.permissions.read")
								: t("links.link.permissions.write")}
						</Label>
						<Input
							className="hidden sm:block"
							placeholder={t("links.link.placeholder")}
							disabled={true}
							value={`${process.env.NEXT_PUBLIC_APP_URL}/app/folders/${lastSlug}?share=${token.token}`}
						/>
						<div className="flex items-center gap-2">
							<Button
								onClick={() =>
									copyToClipboard(
										`${process.env.NEXT_PUBLIC_APP_URL}/app/folders/${lastSlug}?share=${token.token}`
									)
								}
								className="text-start flex-1 sm:flex-none"
							>
								{t("links.link.copy")}
							</Button>
						</div>
					</Fragment>
				);
			})}
		</>
	);
}
