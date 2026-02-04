"use client";

import FaqAccordion from "@/components/pages/landing/FaqAccordion";
import FeatureCarouselPreview from "@/components/pages/landing/FeatureCarouselPreview";
import Hero from "@/components/pages/landing/Hero";
import { useTranslations } from "next-intl";
import { useRef } from "react";

export default function RootPage() {
	const t = useTranslations("pages.landing");
	const seeMoreRef = useRef<HTMLDivElement>(null);

	return (
		<div className="mt-11 mb-32">
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
