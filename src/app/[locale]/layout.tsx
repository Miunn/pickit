import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/toaster';
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pickit",
    description: "Upload and share images with ease.",
};

type Props = {
    children: ReactNode;
    params: { locale: string };
};

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default async function RootLayout({ children, params }: Props) {

    const messages = await getMessages();

    return (
        <html lang={params.locale}>
            <body className={inter.className}>
                <NextIntlClientProvider messages={messages}>
                    {children}
                    <Toaster />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
