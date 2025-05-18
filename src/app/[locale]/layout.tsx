import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';
import Head from 'next/head';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Echomori",
    description: "Upload and share images with ease.",
    themeColor: "#1f7551",
};

type Props = {
    children: ReactNode;
    params: { locale: string };
};

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default async function LocaleLayout({ children, params }: Props) {

    const messages = await getMessages();

    return (
        <html lang={params.locale} suppressHydrationWarning>
            <Head>
                <meta name="theme-color" content="#1f7551" />
            </Head>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem={true}
                    disableTransitionOnChange={true}>
                    <NextTopLoader color='#30b57e' showSpinner={false} />
                    <NextIntlClientProvider messages={messages}>
                        {children}
                        <Toaster />
                        <SonnerToaster richColors />
                    </NextIntlClientProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
