import FaqAccordion from "@/components/FaqAccordion";
import FeatureCarouselPreview from "@/components/FeatureCarouselPreview";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function RootPage({ params }: { params: { locale: string } }) {
    return (
        <>
            <main className="mb-32">
                <Header className="sticky top-0 z-50 bg-background/90 backdrop-blur mb-11" locale={params.locale} />

                <div className="relative bg-primary h-[600px] rounded-3xl mx-6 text-white flex flex-col justify-center gap-11">
                    <div className="relative w-full max-w-7xl mx-auto">
                        <h1 className="text-6xl mb-8">Save moments of life</h1>

                        <p className="text-xl mb-8">
                            Save your memories and share them to your loved ones<br />
                            with our secure and easy-to-use platform.
                        </p>

                        <div className="flex items-center gap-4">
                            <Button className="p-7 rounded-full" variant={"secondary"}>
                                Get started <ArrowRight />
                            </Button>
                            <Button variant={"link"} className="text-white">
                                See more
                            </Button>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-[296px] -translate-x-1/2 translate-y-1/2">
                        <div className="absolute bottom-0 right-32 translate-y-1/2 w-32 h-32 bg-primary">
                            <div className="w-32 h-32 bg-white rounded-tr-lg "></div>
                        </div>
                        <div className="w-32 h-32 bg-primary rounded-full"></div>
                        <div className="absolute bottom-0 left-32 translate-y-1/2 w-32 h-32 bg-primary">
                            <div className="w-32 h-32 bg-white rounded-tl-lg "></div>
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-primary mt-8"></div>

                        <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary mt-40"></div>

                        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary mt-64"></div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-3 my-32">
                    <div className="col-start-2 col-span-2">
                        <h3 className="text-5xl">Store & Share your photos easily</h3>

                        <p>
                            With Pickit, you can store and share your photos to your loved ones easily.
                            Our platform is secure and easy to use, you can create albums and share them with your friends and family.
                        </p>
                    </div>
                </div>

                <div className="mt-64 max-w-7xl mx-auto">
                    <h2 className="text-2xl font-semibold mb-2">Don't just upload photos,<br />Capture memories and share them with others</h2>
                    <FeatureCarouselPreview />
                </div>

                <FaqAccordion />
            </main>
            <Footer />
        </>
    )
}
