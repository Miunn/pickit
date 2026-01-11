import { FolderTokenPermission } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface ShareMessageViewProps {
	readonly tokenList: {
		email: string;
		permission: FolderTokenPermission;
		expiryDate: Date;
		pinCode?: string;
		allowMap?: boolean;
	}[];
	readonly shareMessage: string;
	readonly setShareMessage: (message: string) => void;
}

export default function ShareMessageView({ tokenList, shareMessage, setShareMessage }: ShareMessageViewProps) {
	const t = useTranslations("dialogs.folders.share");

	return (
		<>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label className="text-base font-medium">
						{t("message.recipients") || "Recipients"}
					</Label>
					<div className="flex flex-wrap gap-2">
						{tokenList.slice(0, 4).map(token => (
							<div
								key={token.email}
								className="bg-muted px-3 py-1 rounded-full text-sm"
							>
								{token.email}
							</div>
						))}
						{tokenList.length > 4 && (
							<div className="bg-muted px-3 py-1 rounded-full text-sm">
								+{tokenList.length - 4}
							</div>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<Label className="text-base font-medium">
						{t("message.label") || "Add a message (optional)"}
					</Label>
					<textarea
						className="w-full min-h-[150px] p-3 border rounded-md resize-none"
						placeholder={
							t("message.placeholder") ||
							"Add a personal message to share with your contacts..."
						}
						value={shareMessage}
						onChange={e => setShareMessage(e.target.value)}
					/>
				</div>
			</div>
		</>
	);
}
