import type {Metadata} from "next";
import {Inter} from "next/font/google";
import Header from "@/components/layout/Header";
import "../../globals.css";
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
        <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
            <div className={"min-h-screen"}>
                <Header/>
                {children}
            </div>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}
