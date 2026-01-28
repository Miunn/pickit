import { BadgeCheck, BadgeMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function ActiveBadge({
	isActive,
	t,
	activeKey,
	inactiveKey,
}: {
	readonly isActive: boolean;
	readonly t?: ReturnType<typeof useTranslations>;
	readonly activeKey: string;
	readonly inactiveKey: string;
}) {
	if (isActive) {
		return (
			<Badge className="bg-green-600 hover:bg-green-700 flex gap-2 w-fit">
				<BadgeCheck /> {t?.(activeKey)}
			</Badge>
		);
	}

	return (
		<Badge className="bg-red-600 hover:bg-red-700 flex gap-2 w-fit">
			<BadgeMinus /> {t?.(inactiveKey)}
		</Badge>
	);
}
