import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useTranslations } from "next-intl";

export default function ActiveTooltip({
	t,
	tooltipKey,
}: {
	readonly t?: ReturnType<typeof useTranslations>;
	readonly tooltipKey?: string;
}) {
	return (
		<TooltipProvider>
			<Tooltip delayDuration={0}>
				<TooltipTrigger>
					<CircleHelp className="w-4 h-4 cursor-pointer" />
				</TooltipTrigger>
				<TooltipContent className="max-w-80 text-center">
					<span>{t?.(tooltipKey)}</span>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
