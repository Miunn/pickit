import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { getMessages } from 'next-intl/server';
import { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';
import { PricingProvider } from '@/context/PricingContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Echomori",
    description: "Upload and share images with ease.",
};

export const viewport: Viewport = {
    themeColor: "#1f7551",
};

type Props = {
    children: ReactNode;
    params: Promise<{ locale: string }>;
};

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default async function LocaleLayout(props: Props) {
    const params = await props.params;

    const {
        children
    } = props;

    const messages = await getMessages();

    return (
        <html lang={params.locale} suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem={true}
                    disableTransitionOnChange={true}>
                    <NextTopLoader color='#30b57e' showSpinner={false} />
                    <NextIntlClientProvider messages={messages}>
                        <PricingProvider>
                            {children}
                            <Toaster />
                            <SonnerToaster richColors />
                        </PricingProvider>
                    </NextIntlClientProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
