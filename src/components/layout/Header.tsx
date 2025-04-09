'use client'

import Link from "next/link";
import { Button } from "../ui/button";
import { Command, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import SwitchLocale from "../generic/SwitchLocale";
import { useLocale, useTranslations } from "next-intl";
import { SwitchTheme } from "../generic/SwitchTheme";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function Header({ className }: { className?: string  }) {
    const t = useTranslations("components.header");
    const locale = useLocale();
    const headerRowRef = React.useRef<HTMLHRElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const scrollState = {
        top: true,
        topThreshold: 10,
        onScroll: function () {
            if (this.top && window.scrollY > this.topThreshold) {
                this.top = false;
                this.updateUI();
            } else if (!this.top && window.scrollY <= this.topThreshold) {
                this.top = true;
                this.updateUI();
            }
        },
        updateUI: function () {
            headerRowRef.current?.classList.toggle("opacity-0");
            headerRowRef.current?.classList.toggle("opacity-100");
        },
    };

    React.useEffect(() => {
        window.addEventListener("scroll", () => scrollState.onScroll());
        return () => window.removeEventListener("scroll", () => scrollState.onScroll());
    });

    const NavLinks = () => (
        <>
            <Link href={`/${locale}/features`} className="hover:text-primary transition-colors">{ t('nav.features') }</Link>
            <Link href={`/${locale}/pricing`} className="hover:text-primary transition-colors">{ t('nav.pricing') }</Link>
            <Link href={`/${locale}/contact`} className="hover:text-primary transition-colors">{ t('nav.contact') }</Link>
        </>
    );

    return (
        <header className={cn("flex items-center justify-between py-4", "sticky top-0 z-50 bg-background/90 backdrop-blur", className)}>
            <div className={"w-full grid grid-cols-3 items-center max-w-7xl mx-auto px-4"}>
                <Link href={`/${locale}`} className="w-fit flex items-center gap-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <Command className="size-4" />
                    </div>
                    <h1 className="text-xl font-bold">Echomori</h1>
                </Link>

                <nav className="opacity-0 md:opacity-100 place-self-center">
                    <ul className="grid grid-cols-3 place-items-center gap-10 font-semibold text-sm">
                        <li><NavLinks /></li>
                    </ul>
                </nav>

                <div className="w-fit place-self-end flex gap-2 items-center justify-end">
                    <div className="hidden md:flex gap-2">
                        <Button asChild>
                            <Link href={`/${locale}/signin`}>{ t('nav.login') }</Link>
                        </Button>
                        <SwitchLocale locale={locale} />
                        <SwitchTheme />
                    </div>
                    
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px] z-[100]">
                            <nav className="flex flex-col gap-4 mt-8">
                                <NavLinks />
                                <div className="flex flex-col gap-4 mt-4">
                                    <Button asChild className="w-full">
                                        <Link href={`/${locale}/signin`}>{ t('nav.login') }</Link>
                                    </Button>
                                    <div className="flex justify-center gap-4 relative">
                                        <div className="relative z-[101]">
                                            <SwitchLocale locale={locale} />
                                        </div>
                                        <div className="relative z-[101]">
                                            <SwitchTheme />
                                        </div>
                                    </div>
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <hr ref={headerRowRef} className="absolute w-full bottom-0 transition-opacity duration-300 ease-in-out opacity-0"></hr>
        </header>
    );
}
