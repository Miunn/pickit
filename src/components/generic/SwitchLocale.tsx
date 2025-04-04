"use client"

import { cn, switchLocaleUrl } from "@/lib/utils";
import { Languages } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { usePathname, useSearchParams } from "next/navigation";

export default function SwitchLocale({ locale, className }: { locale: string, className?: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return (
        <Button variant={"ghost"} size={"icon"} asChild>
        <Link href={switchLocaleUrl(pathname + "?" + searchParams.toString(), locale === "en" ? "fr" : "en")} className={cn("font-normal", className)}>
            <Languages className="w-4 h-4" />
        </Link>
        </Button>
    )
}