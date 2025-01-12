"use client"

import { cn, switchLocaleUrl } from "@/lib/utils";
import { Languages } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

export default function SwitchLocale({ locale, className }: { locale: string, className?: string }) {
    const pathname = usePathname();

    return (
        <Button variant={"ghost"} size={"icon"}>
        <Link href={switchLocaleUrl(pathname, locale === "en" ? "fr" : "en")} className={cn("font-normal", className)}>
            <Languages className="w-4 h-4" />
        </Link>
        </Button>
    )
}