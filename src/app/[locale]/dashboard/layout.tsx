import type {Metadata} from "next";
import {Inter} from "next/font/google";
import Header from "@/components/layout/Header";
import RailBar from "@/components/layout/RailBar";
import "../../globals.css";
import {Toaster} from "@/components/ui/toaster";
import {NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Pickit",
    description: "Upload and share images with ease.",
};

export default async function LocaleLayout({
                                               children,
                                               params: {locale},
                                           }: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {

    const messages = await getMessages();

    return (
        <html lang={locale}>
        <body className={inter.className} style={{
            display: "grid",
            gridTemplateColumns: "256px 1fr",
        }}>
        <NextIntlClientProvider messages={messages}>
            <RailBar locale={locale} />
            <div className={"flex flex-col ml-64"}>
                <Header/>
                {children}
            </div>

            <Toaster/>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}
