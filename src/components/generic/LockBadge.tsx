import { LockOpen, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LockBadge({
	isLocked,
	t,
	lockedKey,
	unlockedKey,
}: {
	readonly isLocked: boolean;
	readonly t?: ReturnType<typeof useTranslations>;
	readonly lockedKey: string;
	readonly unlockedKey: string;
}) {
	if (isLocked) {
		return (
			<p className="flex items-center text-muted-foreground truncate">
				<Lock className="mr-2" /> {t?.(lockedKey)}
			</p>
		);
	}

	return (
		<p className="flex items-center text-muted-foreground truncate">
			<LockOpen className="mr-2" /> {t?.(unlockedKey)}
		</p>
	);
}
