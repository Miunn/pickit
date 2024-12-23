import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getLightFolders } from "@/actions/actions";
import { Folder, Image, Link } from "lucide-react";
import HeaderBreadcumb from "@/components/layout/HeaderBreadcumb";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pickit",
    description: "Upload and share images with ease.",
};

export default async function LocaleLayout({
    children,
    params: { locale, folderId },
}: Readonly<{
    children: React.ReactNode;
    params: { locale: string, folderId?: string; };
}>) {

    const messages = await getMessages();

    const folders = (await getLightFolders()).lightFolders;

    console.log("Locale in layout:", locale);
    console.log("Folder Id in layout:", folderId);

    return (
        <html lang={locale}>
            <body className={inter.className}>
                <NextIntlClientProvider messages={messages}>
                    <SidebarProvider>
                        <AppSidebar items={{
                            navMainItems: [
                                {
                                    title: "Folders",
                                    icon: Folder,
                                    url: "/dashboard/folders",
                                    items: folders.map((folder) => ({
                                        title: folder.name,
                                        url: `/dashboard/folders/${folder.id}`
                                    }))
                                },
                                {
                                    title: "Images",
                                    icon: Image,
                                    url: "#",
                                    items: []
                                },
                                {
                                    title: "Links",
                                    icon: Link,
                                    url: "#",
                                    items: []
                                }
                            ],
                            navSecondayrItems: [],
                            navUserItems: {
                                name: "Dummy",
                                email: "exemple@user.fr",
                                avatar: ""
                            },
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
