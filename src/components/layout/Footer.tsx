import { useLocale, useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function Footer() {

    const t = useTranslations("components.footer");
    const locale = useLocale();

    return (
        <footer className="border-t border-primary px-6">
            <div className="max-w-7xl mx-auto py-12">
                <div className="flex flex-col md:flex-row justify-between">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl text-center lg:text-left tracking-wider">Echomori</h1>

                    <div className="flex flex-col sm:flex-row sm:justify-between md:justify-start gap-6 md:gap-16 mt-8 sm:mt-16 md:mt-0">
                        <div className="flex flex-col gap-4">
                            <Label>{t('about.title')}</Label>

                            <div className="flex flex-col gap-2">
                                <Link href={`/${locale}/features`} className="text-sm font-medium text-foreground/60">{t("about.features")}</Link>
                                <Link href="#" className="text-sm font-medium text-foreground/60">{t("about.pricing")}</Link>
                                <Link href={`/${locale}/contact`} className="text-sm font-medium text-foreground/60">{t("about.contact")}</Link>

                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Label>{t('documentation.title')}</Label>

                            <div className="flex flex-col gap-2">
                                <Link href={`/${locale}#faq`} className="text-sm font-medium text-foreground/60">{t("documentation.faq")}</Link>
                                <Link href="#" className="text-sm font-medium text-foreground/60">{t("documentation.support")}</Link>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Label>{t('legal.title')}</Label>

                            <div className="flex flex-col gap-2">
                                <Link href="#" className="text-sm font-medium text-foreground/60">{t("legal.terms")}</Link>
                                <Link href="#" className="text-sm font-medium text-foreground/60">{t("legal.privacy")}</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="w-fit ml-auto text-sm text-foreground/60 mt-11">{t('copyright.text')}</p>
            </div>
        </footer>
    )
}