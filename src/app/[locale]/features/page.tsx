import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Timeline } from "@/components/ui/timeline"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

export default function FeaturesPage() {

    const t = useTranslations("pages.features");

    return (
        <>
            <Header className="sticky top-0 z-50 bg-background/90 backdrop-blur mb-11" />
            <main className="max-w-7xl mx-auto">

                <div className="max-w-5xl mx-auto">
                    <div className="mt-20 py-6 px-4 md:px-8 lg:px-10">
                        <h2 className="text-lg md:text-4xl mb-4 text-black dark:text-white max-w-4xl">
                            {t('title')}
                        </h2>
                        <p className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base max-w-sm">
                            {t('description')}
                        </p>
                    </div>
                    <Timeline data={[
                        {
                            title: t('albums.label'),
                            content: <div>
                                📁 {t('albums.feature1')}<br />
                                📁 {t('albums.feature2')}<br />
                                📁 {t('albums.feature3')}<br />
                                📁 {t('albums.feature4')}<br />
                                📁 {t('albums.feature5')}<br />
                                📁 {t('albums.feature6')}<br />

                                <div className="w-96 h-96 rounded-xl mt-11 bg-red-400"></div>
                            </div>
                        },
                        {
                            title: t('images.label'),
                            content: <div>
                                🖼️ {t('images.feature1')}<br />
                                🖼️ {t('images.feature2')}<br />
                                🖼️ {t('images.feature3')}<br />
                                🖼️ {t('images.feature4')}<br />
                                🖼️ {t('images.feature5')}<br />
                                🖼️ {t('images.feature6')}<br />
                                <div className="w-96 h-96 rounded-xl mt-11 bg-red-400"></div>
                            </div>
                        },
                        {
                            title: t('sharing.label'),
                            content: <div>
                                🚀 {t('sharing.feature1')}<br />
                                🚀 {t('sharing.feature2')}<br />
                                🚀 {t('sharing.feature3')}<br />
                                🚀 {t('sharing.feature4')}<br />
                                🚀 {t('sharing.feature5')}<br />
                                🚀 {t('sharing.feature6')}<br />
                                🚀 {t('sharing.feature7')}<br />
                                🚀 {t('sharing.feature8')}<br />
                                🚀 {t('sharing.feature9')}<br />
                                <div className="w-96 h-96 rounded-xl mt-11 bg-red-400"></div>
                            </div>
                        },
                        {
                            title: t('search.label'),
                            content: <div>
                                🔍 {t('search.feature1')}<br />
                                🔍 {t('search.feature2')}<br />
                                🔍 {t('search.feature3')}<br />
                                🔍 {t('search.feature4')}<br />
                                🔍 {t('search.feature5')}<br />
                                <div className="w-96 h-96 rounded-xl mt-11 bg-red-400"></div>
                            </div>
                        }
                    ]} />
                </div>

                <div className="w-full bg-primary text-primary-foreground py-20 px-4 my-24 rounded-xl md:px-8 lg:px-32">
                    <h1 className="text-3xl">{t('footer.title')}</h1>
                    <p className="leading-10 text-lg">
                        {t('footer.description')}
                    </p>
                    <Button className="p-7 mt-6 rounded-full" variant={"secondary"} asChild>
                        <Link href={"/signin?side=register"}>
                           {t('footer.cta')} <ArrowRight />
                        </Link>
                    </Button>
                </div>
            </main>
            <Footer />
        </>
    )
}