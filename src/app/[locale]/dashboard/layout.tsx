import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Folder, Image, Link } from "lucide-react";
import HeaderBreadcumb from "@/components/layout/HeaderBreadcumb";
import { auth } from "@/actions/auth";
import { getLightFolders } from "@/actions/folders";
import { getLightImages } from "@/actions/images";
import { getAccessTokens } from "@/actions/accessTokens";
import getMe from "@/actions/user";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pickit",
    description: "Upload and share images with ease.",
};

export default async function LocaleLayout({
    children,
    params: { locale },
}: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {

    const session = await auth();
    const me = (await getMe()).user!;
    const messages = await getMessages();

    const folders = (await getLightFolders()).lightFolders;
    const images = (await getLightImages()).lightImages;
    const links = (await getAccessTokens()).accessTokens;

    return (
        <html lang={locale}>
            <body className={inter.className}>
                <NextIntlClientProvider messages={messages}>
                    <SidebarProvider>
                        <AppSidebar locale={locale} user={me} items={{
                            navMainItems: [
                                {
                                    title: "Folders",
                                    icon: Folder,
                                    url: `/${locale}/dashboard/folders`,
                                    isActive: true,
                                    items: folders.map((folder) => ({
                                        title: folder.name,
                                        url: `/${locale}/dashboard/folders/${folder.id}`
                                    }))
                                },
                                {
                                    title: "Images",
                                    icon: Image,
                                    url: `/${locale}/dashboard/images`,
                                    items: images.map((image) => ({
                                        title: `${image.folder.name} - ${image.name}`,
                                        url: `/${locale}/dashboard/folders/${image.folder.id}`
                                    }))
                                },
                                {
                                    title: "Links",
                                    icon: Link,
                                    url: `/${locale}/dashboard/links`,
                                    items: links.map((link) => ({
                                        title: `${link.permission.toString()} - ${link.folder.name}`,
                                        url: `/${locale}/dashboard/links?l=${link.id}`
                                    }))
                                }
                            ],
                            navSecondayrItems: [
                                
                            ],
                        }} />
                        <SidebarInset>
                            <header className="flex h-16 shrink-0 items-center gap-2">
                                <div className="flex items-center gap-2 px-4">
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator orientation="vertical" className="mr-2 h-4" />
                                    <HeaderBreadcumb />
                                </div>
                            </header>
                            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                                {children}
                            </div>
                        </SidebarInset>
                    </SidebarProvider>
                    <Toaster />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
