import Link from "next/link";
import { Button } from "../ui/button";

export default async function Header({ locale }: { locale: string }) {
    return (
        <header className="flex items-center justify-between px-6 py-4 border-b">
            <div className={"w-full flex items-center justify-between max-w-7xl mx-auto"}>
                <Link href={`/${locale}`}>
                    <h1 className="text-2xl font-bold">Pickit</h1>
                </Link>

                <nav>
                    <ul className="flex items-center gap-10 font-semibold text-sm">
                        <li>
                            <Link href={`/${locale}/pricing`}>Pricing</Link>
                        </li>
                        <li>
                            <Link href={`/${locale}/signin`}>Login</Link>
                        </li>
                        <li>
                            <Button asChild>
                                <Link href={`/${locale}/signin`}>Start</Link>
                            </Button>
                        </li>
                        <li>
                            <Link href={`/${locale === "en" ? "fr" : "en"}`} className="border rounded-full p-2 font-normal">{locale === "en" ? "EN" : "FR"}</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
