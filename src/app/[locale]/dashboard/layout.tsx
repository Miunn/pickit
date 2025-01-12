import type { Metadata } from "next";
import "../../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Folder, Image, Link } from "lucide-react";
import HeaderBreadcumb from "@/components/layout/HeaderBreadcumb";
import { getLightFolders } from "@/actions/folders";
import { getLightImages } from "@/actions/images";
import { getAccessTokens } from "@/actions/accessTokens";
import getMe from "@/actions/user";
import UnverifiedEmail from "@/components/layout/UnverifiedEmail";
import { addDays } from "date-fns";
import { getPersonsAccessTokens } from "@/actions/accessTokensPerson";
import SwitchLocale from "@/components/generic/SwitchLocale";

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
    const t = await getTranslations("sidebar");
    const me = (await getMe()).user;
    const folders = (await getLightFolders()).lightFolders;
    const images = (await getLightImages()).lightImages;
    const accessTokens = (await getAccessTokens()).accessTokens;
    const personsAccessTokens = (await getPersonsAccessTokens()).personAccessTokens;

    return (
        <>
            <SidebarProvider>
                <AppSidebar locale={locale} user={me} items={{
                    navMainItems: [
                        {
                            key: "folders",
                            title: t('main.folders'),
                            icon: Folder,
                            url: `/${locale}/dashboard/folders`,
                            isActive: true,
                            items: folders.map((folder) => ({
                                key: folder.id,
                                title: folder.name,
                                url: `/${locale}/dashboard/folders/${folder.id}`
                            }))
                        },
                        {
                            key: "images",
                            title: t('main.images'),
                            icon: Image,
                            url: `/${locale}/dashboard/images`,
                            items: images.map((image) => ({
                                key: image.id,
                                title: `${image.folder.name} - ${image.name}`,
                                url: `/${locale}/dashboard/folders/${image.folder.id}`
                            }))
                        },
                        {
                            key: "links",
                            title: t('main.links'),
                            icon: Link,
                            url: `/${locale}/dashboard/links`,
                            items: accessTokens.map((accessToken) => ({
                                key: accessToken.id,
                                title: `${accessToken.permission.toString()} - ${accessToken.folder.name}`,
                                url: `/${locale}/dashboard/links?l=${accessToken.id}`
                            })).concat(personsAccessTokens.map((accessToken) => ({
                                key: accessToken.id,
                                title: `${accessToken.permission.toString()} - ${accessToken.folder.name}`,
                                url: `/${locale}/dashboard/links?l=${accessToken.id}`
                            })))
                        }
                    ],
                    navSecondayrItems: [

                    ],
                }} />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2">
                        <div className="w-full flex justify-between items-center px-4">
                            <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <HeaderBreadcumb />
                            </div>
                            <SwitchLocale locale={locale} className="text-xs" />
                        </div>
                    </header>
                    {me?.emailVerified === false ? (
                        <UnverifiedEmail locale={locale} userDeletionDate={me.emailVerificationDeadline || addDays(me.createdAt, 7)} />
                    ) : null}
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
            <Toaster />
        </>
    );
}
