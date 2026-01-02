import { ReactNode } from "react";
import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
};

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default function RootLayout({ children }: { readonly children: ReactNode }) {
    return children;
}
