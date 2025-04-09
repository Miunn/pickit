'use client'

import FaqAccordion from "@/components/FaqAccordion";
import FeatureCarouselPreview from "@/components/FeatureCarouselPreview";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";

export default function ClientPage() {
    
    const t = useTranslations("pages.landing");
    const locale = useLocale();
    const moreRef = useRef<HTMLDivElement>(null);
    
    return (
        <>
            <main className="mb-32">
                <Header className="sticky top-0 z-50 bg-background/90 backdrop-blur mb-11 px-6" />

                <div className="relative bg-primary h-[500px] md:h-[600px] rounded-3xl mx-6 text-white">
                    <div className="max-w-7xl grid lg:grid-cols-2 gap-11 justify-between items-center px-11 mx-auto h-full">
                        <div className="relative col-span-2">
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
                            <h1 className="relative text-6xl lg:max-w-lg mb-8">
                                {locale === "fr"
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
                                        Save moments<br className="hidden lg:block" /> of <span className="relative">
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

                            <p className="text-xl lg:max-w-xl mb-8">
                                {t('hero.description')}
                            </p>

                            <div className="flex items-center gap-4">
                                <Button className="p-7 rounded-full" variant={"secondary"} asChild>
                                    <Link href={"/signin?side=register"}>
                                        {t('hero.getStarted')} <ArrowRight />
                                    </Link>
                                </Button>
                                <Button variant={"link"} className="text-white" onClick={() => moreRef.current?.scrollIntoView({ behavior: "smooth" })}>
                                    {t('hero.seeMore')}
                                </Button>
                            </div>
                        </div>

                        <div className="hidden lg:block relative h-full">
                            <Image className="rounded-xl absolute left-1/3 top-1/3 -translate-x-1/2 -translate-y-1/2 object-cover" src={"/beach.jpg"} alt="beach" width={320} height={213} />
                            <Image className="rounded-xl absolute right-1/2 bottom-1/3 translate-x-1/2 translate-y-1/2 object-cover" src={"/bridge.jpg"} alt="beach" width={300} height={200} />
                            <Image className="rounded-xl absolute left-2/3 top-1/3 -translate-y-1/2 object-cover" src={"/parrot.jpg"} alt="beach" width={170} height={256} />
                        </div>
                    </div>


                    <div className="hidden lg:block absolute bottom-0 lg:left-[200px] xl:left-[296px] -translate-x-1/2 translate-y-1/2">
                        <div className="absolute bottom-0 right-32 translate-y-1/2 w-32 h-32 bg-primary">
                            <div className="w-32 h-32 bg-background rounded-tr-lg "></div>
                        </div>
                        <div className="w-32 h-32 bg-primary rounded-full"></div>
                        <div className="absolute bottom-0 left-32 translate-y-1/2 w-32 h-32 bg-primary">
                            <div className="w-32 h-32 bg-background rounded-tl-lg "></div>
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-primary mt-8"></div>

                        <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary mt-40"></div>

                        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary mt-64"></div>
                    </div>
                </div>

                <div ref={moreRef} className="max-w-7xl grid grid-cols-4 xl:grid-cols-3 my-16 lg:my-32 mx-16">
                    <div className="col-start-1 lg:col-start-2 col-end-5 xl:col-end-4">
                        <h3 className="text-4xl md:text-5xl">Store & Share your photos easily</h3>

                        <p>
                            With Echomori, you can store and share your photos to your loved ones easily.
                            Our platform is secure and easy to use, you can create albums and share them with your friends and family.
                        </p>
                    </div>
                </div>

                <div className="mt-32 lg:mt-64 max-w-2xl xl:max-w-7xl mx-auto px-4">
                    <h2 className="text-2xl font-semibold mb-2" dangerouslySetInnerHTML={{ __html: t('featuresTitle') }} />
                    <FeatureCarouselPreview />
                </div>

                <div id="faq" className="mx-4">
                    <FaqAccordion />
                </div>
            </main>
            <Footer />
        </>
    )
}