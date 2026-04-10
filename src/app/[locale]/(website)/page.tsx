"use client";

import FaqAccordion from "@/components/pages/landing/FaqAccordion";
import FeatureCarouselPreview from "@/components/pages/landing/FeatureCarouselPreview";
import Hero from "@/components/pages/landing/Hero";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

export default function RootPage() {
	const t = useTranslations("pages.landing");
	const seeMoreRef = useRef<HTMLDivElement>(null);

	return (
		<div className="mb-32 bg-blend-overlay">
			<div className="z-10 flex min-h-64 items-center justify-center">
				<div
					className={cn(
						"group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
					)}
				>
					<AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
						<span>✨ Introducing Magic UI</span>
						<ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
					</AnimatedShinyText>
				</div>
			</div>
			<Hero seeMoreRef={seeMoreRef} />

			<div ref={seeMoreRef} className="pt-32 max-w-2xl xl:max-w-7xl mx-auto px-4">
				<h2
					className="text-2xl font-semibold mb-2"
					dangerouslySetInnerHTML={{ __html: t("featuresTitle") }}
				/>
				<FeatureCarouselPreview />
			</div>

			<div id="faq" className="mx-4">
				<FaqAccordion />
			</div>
		</div>
	);
}
