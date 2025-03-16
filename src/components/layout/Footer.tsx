import { useLocale, useTranslations } from "next-intl";
import { Label } from "../ui/label";
import Link from "next/link";

export default function Footer() {

    const t = useTranslations("components.footer");
    const locale = useLocale();

    return (
        <footer className="border-t border-primary">
            <div className="max-w-7xl mx-auto py-12">
                <div className="flex justify-between">
                    <h1 className="text-7xl tracking-wider">Pickit</h1>

                    <div className="flex gap-16">
                        <div className="flex flex-col gap-4">
                            <Label>{t('about.title')}</Label>

                            <div className="flex flex-col gap-2">
                                <Link href={`/${locale}/features`} className="text-sm font-medium text-gray-600">{t("about.features")}</Link>
                                <Link href="#" className="text-sm font-medium text-gray-600">{t("about.pricing")}</Link>
                                <Link href={`/${locale}/contact`} className="text-sm font-medium text-gray-600">{t("about.contact")}</Link>

                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Label>{t('documentation.title')}</Label>

                            <div className="flex flex-col gap-2">
                                <Link href={`/${locale}#faq`} className="text-sm font-medium text-gray-600">{t("documentation.faq")}</Link>
                                <Link href="#" className="text-sm font-medium text-gray-600">{t("documentation.support")}</Link>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Label>{t('legal.title')}</Label>

                            <div className="flex flex-col gap-2">
                                <Link href="#" className="text-sm font-medium text-gray-600">{t("legal.terms")}</Link>
                                <Link href="#" className="text-sm font-medium text-gray-600">{t("legal.privacy")}</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="w-fit ml-auto text-sm text-gray-600 mt-11">{t('copyright.text')}</p>
            </div>
        </footer>
    )
}