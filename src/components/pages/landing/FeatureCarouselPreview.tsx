'use client'

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function FeatureCarouselPreview() {

    const t = useTranslations("components.featuresCarousel");

    const [expandedIndex, setExpandedIndex] = React.useState<number>(0);
    const progressRefs = React.useRef<Array<React.RefObject<HTMLDivElement | null>>>([]);

    // Initialize refs array on mount
    React.useEffect(() => {
        progressRefs.current = Array(4).fill(null).map(() => React.createRef<HTMLDivElement>());
    }, []);

    React.useEffect(() => {
        if (progressRefs.current[expandedIndex]?.current) {
            progressRefs.current[expandedIndex].current?.classList.add("animate-progress");
        }

        progressRefs.current.forEach((ref, index) => {
            if (index !== expandedIndex && ref.current) {
                ref.current.classList.remove("animate-progress");
            }
        });
    }, [expandedIndex, progressRefs]);

    return (
        <div className="flex flex-col xl:grid xl:grid-cols-2 gap-6 min-h-[444px]">
            <div className="flex flex-col gap-3">
                <Card className={`group cursor-pointer transition-all duration-500 ease-in-out overflow-hidden ${expandedIndex === 0 ? "max-h-64" : "max-h-18"}`} onClick={() => setExpandedIndex(0)}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${expandedIndex === 0 ? "text-primary" : "text-gray-500"}`} onClick={() => setExpandedIndex(0)}>
                            <kbd className={expandedIndex === 0
                                ? "inline-flex items-center justify-center text-primary-foreground h-5 min-w-[20px] text-[11px] px-1 rounded font-medium font-sans bg-primary ring-1 ring-inset ring-primary"
                                : "inline-flex items-center justify-center text-muted-foreground h-5 w-5 text-[11px] px-1 rounded font-medium bg-muted ring-1 ring-inset ring-muted"
                            }>1</kbd>
                            {t('section1.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={`transition-all duration-500 ease-in-out ${expandedIndex === 0 ? "max-h-32 opacity-100" : "max-h-0 opacity-0 py-0"}`}>
                        <p className="text-sm text-foreground mb-4" dangerouslySetInnerHTML={{ __html: t('section1.description') }} />
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                            <div ref={progressRefs.current[0]} className="group-hover:[animation-play-state:paused] h-full w-0 flex-1 bg-primary animate-progress" onAnimationEndCapture={() => setExpandedIndex((expandedIndex + 1) % 4)}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`group cursor-pointer transition-all duration-500 ease-in-out overflow-hidden ${expandedIndex === 1 ? "max-h-64" : "max-h-18"}`} onClick={() => setExpandedIndex(1)}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${expandedIndex === 1 ? "text-primary" : "text-gray-500"}`}>
                            <kbd className={expandedIndex === 1
                                ? "inline-flex items-center justify-center text-primary-foreground h-5 min-w-[20px] text-[11px] px-1 rounded font-medium font-sans bg-primary ring-1 ring-inset ring-primary"
                                : "inline-flex items-center justify-center text-muted-foreground h-5 w-5 text-[11px] px-1 rounded font-medium bg-muted ring-1 ring-inset ring-muted"
                            }>2</kbd>
                            {t('section2.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={`transition-all duration-500 ease-in-out ${expandedIndex === 1 ? "max-h-32 opacity-100" : "max-h-0 opacity-0 py-0"}`}>
                        <p className="text-sm text-foreground mb-4">{t('section2.description')}</p>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                            <div ref={progressRefs.current[1]} className="group-hover:[animation-play-state:paused] h-full w-0 flex-1 bg-primary" onAnimationEndCapture={() => setExpandedIndex((expandedIndex + 1) % 4)}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`group cursor-pointer transition-all duration-500 ease-in-out overflow-hidden ${expandedIndex === 2 ? "max-h-64" : "max-h-18"}`} onClick={() => setExpandedIndex(2)}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${expandedIndex === 2 ? "text-primary" : "text-gray-500"}`}>
                            <kbd className={expandedIndex === 2
                                ? "inline-flex items-center justify-center text-primary-foreground h-5 min-w-[20px] text-[11px] px-1 rounded font-medium font-sans bg-primary ring-1 ring-inset ring-primary"
                                : "inline-flex items-center justify-center text-muted-foreground h-5 w-5 text-[11px] px-1 rounded font-medium bg-muted ring-1 ring-inset ring-muted"
                            }>3</kbd>
                            {t('section3.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={`transition-all duration-500 ease-in-out ${expandedIndex === 2 ? "max-h-32 opacity-100" : "max-h-0 opacity-0 py-0"}`}>
                        <p className="text-sm text-foreground mb-4">
                            {t('section3.description')}
                        </p>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                            <div ref={progressRefs.current[2]} className="group-hover:[animation-play-state:paused] h-full w-0 flex-1 bg-primary" onAnimationEndCapture={() => setExpandedIndex((expandedIndex + 1) % 4)}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`group cursor-pointer transition-all duration-500 ease-in-out overflow-hidden ${expandedIndex === 3 ? "max-h-64" : "max-h-18"}`} onClick={() => setExpandedIndex(3)}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${expandedIndex === 3 ? "text-primary" : "text-gray-500"}`}>
                            <kbd className={expandedIndex === 3
                                ? "inline-flex items-center justify-center text-primary-foreground h-5 min-w-[20px] text-[11px] px-1 rounded font-medium font-sans bg-primary ring-1 ring-inset ring-primary"
                                : "inline-flex items-center justify-center text-muted-foreground h-5 w-5 text-[11px] px-1 rounded font-medium bg-muted ring-1 ring-inset ring-muted"
                            }>4</kbd>
                            {t('section4.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={`transition-all duration-500 ease-in-out ${expandedIndex === 3 ? "max-h-32 opacity-100" : "max-h-0 opacity-0 py-0"}`}>
                        <p className="text-sm text-foreground mb-4">
                            {t('section4.description')}
                        </p>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                            <div ref={progressRefs.current[3]} className="group-hover:[animation-play-state:paused] h-full w-0 flex-1 bg-primary" onAnimationEndCapture={() => setExpandedIndex((expandedIndex + 1) % 4)}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="w-full h-96 border border-gray-200 rounded-lg">

            </div>
        </div>
    )
}