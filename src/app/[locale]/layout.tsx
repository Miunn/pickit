import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { getMessages } from "next-intl/server";
import { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { PricingProvider } from "@/context/PricingContext";
import { E2EEncryptionProvider } from "@/context/E2EEncryptionContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Echomori",
    description: "Upload and share images with ease.",
};

export const viewport: Viewport = {
    themeColor: "#1f7551",
};

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default async function LocaleLayout({
    children,
    params,
}: {
    readonly children: ReactNode;
    readonly params: Promise<{ readonly locale: string }>;
}) {
    const { locale } = await params;

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem={true}
                    disableTransitionOnChange={true}
                >
                    <NextTopLoader color="#30b57e" showSpinner={false} />
                    <NextIntlClientProvider messages={messages}>
                        <E2EEncryptionProvider>
                            <PricingProvider>
                                {children}
                                <Toaster />
                                <SonnerToaster richColors />
                            </PricingProvider>
                        </E2EEncryptionProvider>
                    </NextIntlClientProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
