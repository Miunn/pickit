'use client'

import Link from "next/link";
import { Button } from "../ui/button";
import { Command } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import SwitchLocale from "../generic/SwitchLocale";

export default function Header({ className, locale }: { className?: string, locale: string }) {

    const headerRowRef = React.useRef<HTMLHRElement>(null);
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

    return (
        <header className={cn("flex items-center justify-between py-4", className)}>
            <div className={"w-full grid grid-cols-3 items-center max-w-7xl mx-auto"}>
                <Link href={`/${locale}`} className="w-fit flex items-center gap-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <Command className="size-4" />
                    </div>
                    <h1 className="text-xl font-bold">Pickit</h1>
                </Link>

                <nav className="place-self-center">
                    <ul className="flex items-center gap-10 font-semibold text-sm">
                        <li>
                            <Link href={`/${locale}/pricing`}>Pricing</Link>
                        </li>
                        <li>
                            <Link href={`/${locale}/signin`}>Login</Link>
                        </li>
                        <li>
                            <Link href={`/${locale}/signin`}>Contact</Link>
                        </li>
                    </ul>
                </nav>

                <div className="w-fit place-self-end flex gap-2">
                    <Button>
                        <Link href={`/${locale}/signin`}>Login</Link>
                    </Button>
                    <SwitchLocale locale={locale} />
                </div>
            </div>

            <hr ref={headerRowRef} className="absolute w-full bottom-0 transition-opacity duration-300 ease-in-out opacity-0"></hr>
        </header>
    );
}
