import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/layout/Header";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Echomori",
    description: "Upload and share images with ease.",
};

export default async function LocaleLayout(
    props: Readonly<{
        children: React.ReactNode;
    }>
) {
    const {
        children
    } = props;

    return (
        <>
            <div className={"min-h-screen flex flex-col"}>
                <Header />
                {children}
            </div>
            <Toaster />
        </>
    );
}
