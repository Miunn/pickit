import ContactForm from "@/components/ContactForm";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

export default function ContactPage() {

    const t = useTranslations("pages.contact");

    return (
        <>
            <main>
                <Header className="fixed w-full top-0 z-50 bg-background/90 backdrop-blur mb-11" />

                <div className="min-h-screen grid grid-cols-3 gap-8 items-center max-w-7xl mx-auto">
                    <div>
                        <Label className="text-primary font-semibold">{ t('titleMini') }</Label>
                        <h1 className="text-6xl">{ t('title') }</h1>
                    </div>

                    <div className="border w-px"></div>

                    <div>
                        <ContactForm />
                    </div>

                </div>
            </main>
            <Footer />
        </>
    )
}