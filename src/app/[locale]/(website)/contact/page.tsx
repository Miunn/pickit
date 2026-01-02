import ContactForm from "@/components/pages/contact/ContactForm";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import WorldMap from "@/components/ui/world-map";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("metadata.contact");
    return {
        title: t("title"),
        description: t("description"),
    };
}

export default function ContactPage() {
    const t = useTranslations("pages.contact");

    return (
        <div className="min-h-screen grid grid-cols-[1fr_1px_1fr] items-center mx-auto border-t border-primary/50">
            <div className="w-full h-full relative grid grid-cols-1 grid-rows-[2fr_1fr] place-items-center">
                <div className="z-10">
                    <Label className="text-primary font-semibold">{t("titleMini")}</Label>
                    <h1 className="text-6xl">{t("title")}</h1>
                    <p className="mt-6 max-w-lg">{t("description")}</p>

                    <Button variant={"link"} className="p-0" asChild>
                        <Link href={""}>
                            {t("sendEmail")} <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 w-full">
                    <WorldMap
                        dots={[
                            {
                                start: { lat: 64.2008, lng: -149.4937 }, // Alaska (Fairbanks)
                                end: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
                            },
                            {
                                start: { lat: 64.2008, lng: -149.4937 }, // Alaska (Fairbanks)
                                end: { lat: -25.7975, lng: -45.8919 }, // Brazil (Brasília)
                            },
                            {
                                start: { lat: -25.7975, lng: -45.8919 }, // Brazil (Brasília)
                                end: { lat: 36.7223, lng: 2.1393 }, // Paris
                            },
                            {
                                start: { lat: 43.5074, lng: -1.1278 }, // London
                                end: { lat: 28.6139, lng: 77.209 }, // New Delhi
                            },
                            {
                                start: { lat: 28.6139, lng: 77.209 }, // New Delhi
                                end: { lat: 43.1332, lng: 131.9113 }, // Vladivostok
                            },
                            {
                                start: { lat: 28.6139, lng: 77.209 }, // New Delhi
                                end: { lat: -1.2921, lng: 36.8219 }, // Nairobi
                            },
                        ]}
                        lineColor="#1f7551"
                    />
                </div>
            </div>

            <div className="border-l border-primary w-px h-full justify-self-center"></div>

            <div className="max-w-lg w-full mx-auto">
                <ContactForm />
            </div>
        </div>
    );
}
