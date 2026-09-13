import { ComponentPropsWithoutRef, CSSProperties, FC } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
	readonly shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
	children,
	className,
	shimmerWidth = 100,
	...props
}) => {
	return (
		<span
			style={
				{
					"--shiny-width": `${shimmerWidth}px`,
				} as CSSProperties
			}
			className={cn(
				"place-self-end",
				"w-fit flex items-center justify-between rounded-full px-3 py-2",
				"isolate rounded-full bg-white/65 shadow-lg ring-1 ring-black/5 backdrop-blur-sm",
				"opacity-0 md:opacity-100",
				// Shine effect
				"animate-shiny-text bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite] duration-150",

				// Shine gradient
				// "bg-linear-to-r from-transparent via-black/80 via-50% to-transparent dark:via-white/80",

				className
			)}
			{...props}
		>
			{children}
		</span>
	);
};
