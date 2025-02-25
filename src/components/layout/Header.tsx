import Link from "next/link";
import { Button } from "../ui/button";
import { Command } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function Header({ className, locale }: { className?: string, locale: string }) {
    return (
        <header className={cn("flex items-center justify-between px-6 py-4", className)}>
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
                            <Link href={`/${locale}/signin`}>Start</Link>
                        </li>
                    </ul>
                </nav>

                <Button className="w-fit place-self-end">
                    <Link href={`/${locale}/signin`}>Login</Link>
                </Button>
            </div>
        </header>
    );
}
