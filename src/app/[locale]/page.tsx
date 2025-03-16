import FaqAccordion from "@/components/FaqAccordion";
import FeatureCarouselPreview from "@/components/FeatureCarouselPreview";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default async function RootPage({ params }: { params: { locale: string } }) {

    const t = await getTranslations("pages.landing")

    return (
        <>
            <main className="mb-32">
                <Header className="sticky top-0 z-50 bg-background/90 backdrop-blur mb-11" />

                <div className="relative bg-primary h-[600px] rounded-3xl mx-6 text-white">
                    <div className="max-w-7xl grid grid-cols-2 gap-11 justify-between items-center mx-auto h-full">
                        <div className="relative">
                            <div
                                className={cn(
                                    "backdrop-filter-[12px] w-fit inline-flex py-2 items-center justify-between rounded-full border border-white/5 bg-white/10 px-3 text-xs sm:text-sm text-white dark:text-black transition-all ease-in hover:cursor-pointer hover:bg-white/20 group gap-1",
                                    "mb-2"
                                )}
                            >
                                <AnimatedShinyText className="inline-flex items-center justify-center transition ease-out text-neutral-200 hover:text-neutral-100 hover:duration-300 dark:text-neutral-300 hover:dark:text-neutral-200 bg-gradient-to-r from-primary to-accent dark:from-primary dark:to-accent">
                                    <span>✨ Introducing Chat with your albums</span>
                                    <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                                </AnimatedShinyText>
                            </div>
                            <h1 className="relative text-6xl max-w-lg mb-8">
                                {params.locale === "fr"
                                    ? <span>
                                        Sauvegardez des moments de <span className="relative">
                                            vie
                                            <svg
                                                className="pointer-events-none absolute -right-4 top-1 z-20"
                                                width="32"
                                                height="32"
                                                viewBox="0 0 21 21"
                                                style={{
                                                    transform: "rotate(80deg)"
                                                }}
                                            >
                                                <path
                                                    d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
                                                    fill="#FE8FB5"
                                                ></path>
                                            </svg>
                                            <svg
                                                className="pointer-events-none absolute -left-2 bottom-0 z-20"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 21 21"
                                                style={{
                                                    transform: "rotate(50deg)"
                                                }}
                                            >
                                                <path
                                                    d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
                                                    fill="#9E7AFF"
                                                ></path>
                                            </svg>
                                        </span>
                                    </span>
                                    : <span>
                                        Save moments<br /> of <span className="relative">
                                            life
                                            <svg
                                                className="pointer-events-none absolute -right-4 top-1 z-20"
                                                width="32"
                                                height="32"
                                                viewBox="0 0 21 21"
                                                style={{
                                                    transform: "rotate(80deg)"
                                                }}
                                            >
                                                <path
                                                    d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
                                                    fill="#FE8FB5"
                                                ></path>
                                            </svg>
                                            <svg
                                                className="pointer-events-none absolute -left-2 bottom-0 z-20"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 21 21"
                                                style={{
                                                    transform: "rotate(50deg)"
                                                }}
                                            >
                                                <path
                                                    d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
                                                    fill="#9E7AFF"
                                                ></path>
                                            </svg>
                                        </span>
                                    </span>
                                }
                            </h1>

                            <p className="text-xl max-w-xl mb-8">
                                {t('hero.description')}
                            </p>

                            <div className="flex items-center gap-4">
                                <Button className="p-7 rounded-full" variant={"secondary"} asChild>
                                    <Link href={"/signin?side=register"}>
                                        {t('hero.getStarted')} <ArrowRight />
                                    </Link>
                                </Button>
                                <Button variant={"link"} className="text-white">
                                    {t('hero.seeMore')}
                                </Button>
                            </div>
                        </div>

                        <div className="relative h-full">
                            <Image className="rounded-xl absolute left-1/2 top-1/3 -translate-x-2/3 -translate-y-1/2" src={"/beach.jpg"} alt="beach" objectFit="cover" width={320} height={213} />
                            <Image className="rounded-xl absolute right-1/4 bottom-1/3 translate-x-1/2 translate-y-1/2" src={"/bridge.jpg"} alt="beach" objectFit="cover" width={300} height={200} />
                            <Image className="rounded-xl absolute left-2/3 top-1/3 translate-x-1/3 -translate-y-1/2" src={"/parrot.jpg"} alt="beach" objectFit="cover" width={170} height={256} />
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
                    <h2 className="text-2xl font-semibold mb-2" dangerouslySetInnerHTML={{ __html: t('featuresTitle') }} />
                    <FeatureCarouselPreview />
                </div>

                <div id="faq">
                    <FaqAccordion />
                </div>
            </main>
            <Footer />
        </>
    )
}
