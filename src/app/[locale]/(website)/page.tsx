import LandingHead from "@/components/pages/landing/LandingHead";
import FaqAccordion from "@/components/pages/landing/FaqAccordion";
import { getTranslations } from "next-intl/server";
import FeatureCarouselPreview from "@/components/pages/landing/FeatureCarouselPreview";

export default async function RootPage() {
    const t = await getTranslations("pages.landing");

    return (
        <div className="mt-11 mb-32">
            <LandingHead />

            <div className="mt-32 lg:mt-64 max-w-2xl xl:max-w-7xl mx-auto px-4">
                <h2 className="text-2xl font-semibold mb-2" dangerouslySetInnerHTML={{ __html: t('featuresTitle') }} />
                <FeatureCarouselPreview />
            </div>

            <div id="faq" className="mx-4">
                <FaqAccordion />
            </div>
        </div>
    )
}
