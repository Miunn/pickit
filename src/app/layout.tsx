import {ReactNode} from 'react';
import "./globals.css";
import { Metadata } from 'next';

type Props = {
    children: ReactNode;
};

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
    themeColor: "#1f7551",
};

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default function RootLayout({children}: Props) {
    return children;
}
