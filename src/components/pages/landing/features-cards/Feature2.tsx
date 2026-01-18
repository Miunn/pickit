import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface FeatureProps {
	readonly progressRef: React.RefObject<HTMLDivElement | null>;
	readonly isExpanded: boolean;
	readonly onClick: () => void;
	readonly onProgressEnd: () => void;
}

export default function Feature2({ isExpanded, onClick, progressRef, onProgressEnd }: FeatureProps) {
	const t = useTranslations("components.featuresCarousel");

	return (
		<Card
			className={cn(
				"group cursor-pointer transition-all duration-500 ease-in-out overflow-hidden",
				isExpanded ? "max-h-64" : "max-h-18"
			)}
			onClick={onClick}
		>
			<CardHeader>
				<CardTitle
					className={cn(
						"flex items-center gap-2",
						isExpanded ? "text-primary" : "text-gray-500"
					)}
				>
					<kbd
						className={cn(
							"inline-flex items-center justify-center h-5 text-[11px] px-1 rounded",
							"ring-1 ring-inset",
							isExpanded
								? "text-primary-foreground min-w-[20px] font-medium font-sans bg-primary ring-primary"
								: "text-muted-foreground w-5 font-medium bg-muted ring-muted"
						)}
					>
						2
					</kbd>
					{t("section2.title")}
				</CardTitle>
			</CardHeader>
			<CardContent
				className={cn(
					"transition-all duration-500 ease-in-out",
					isExpanded ? "max-h-32 opacity-100" : "max-h-0 opacity-0 py-0"
				)}
			>
				<p className="text-sm text-foreground mb-4">{t("section2.description")}</p>
				<div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
					<div
						ref={progressRef}
						className="group-hover:[animation-play-state:paused] h-full w-0 flex-1 bg-primary"
						onAnimationEndCapture={onProgressEnd}
					></div>
				</div>
			</CardContent>
		</Card>
	);
}
