import type { Metadata } from "next";
import "../../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getTranslations } from "next-intl/server";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Folder, Image, Link } from "lucide-react";
import HeaderBreadcumb from "@/components/layout/HeaderBreadcumb";
import { getLightFolders, getSharedWithMeFolders } from "@/actions/folders";
import { getLightImages } from "@/actions/images";
import { getAccessTokens } from "@/actions/accessTokens";
import UnverifiedEmail from "@/components/layout/UnverifiedEmail";
import { addDays } from "date-fns";
import { getPersonsAccessTokens } from "@/actions/accessTokensPerson";
import SwitchLocale from "@/components/generic/SwitchLocale";
import { Role } from "@prisma/client";
import { getCurrentSession } from "@/lib/authUtils";
import { CommandSearch } from "@/components/CommandSearch";
import { NuqsAdapter } from 'nuqs/adapters/react'

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
    const me = (await getCurrentSession()).user;

    const t = await getTranslations("sidebar");
    const folders = (await getLightFolders()).lightFolders;
    const images = (await getLightImages()).lightImages;
    const accessTokens = (await getAccessTokens()).accessTokens;
    const personsAccessTokens = (await getPersonsAccessTokens()).personAccessTokens;
    const sharedWithMeFolders = (await getSharedWithMeFolders()).accessTokens;

    return (
        <NuqsAdapter>
            <SidebarProvider>
                <AppSidebar locale={locale} user={me} items={{
                    navMainItems: [
                        {
                            key: "folders",
                            title: t('main.folders'),
                            icon: Folder,
                            url: `/${locale}/app/folders`,
                            isActive: true,
                            items: folders.map((folder) => ({
                                key: folder.id,
                                title: folder.name,
                                url: `/${locale}/app/folders/${folder.id}`
                            }))
                        },
                        {
                            key: "images",
                            title: t('main.images'),
                            icon: Image,
                            url: `/${locale}/app/images`,
                            items: images.map((image) => ({
                                key: image.id,
                                title: `${image.folder.name} - ${image.name}`,
                                url: `/${locale}/app/folders/${image.folder.id}`
                            }))
                        },
                        {
                            key: "links",
                            title: t('main.links'),
                            icon: Link,
                            url: `/${locale}/app/links`,
                            items: accessTokens.map((accessToken) => ({
                                key: accessToken.id,
                                title: `${accessToken.permission.toString()} - ${accessToken.folder.name}`,
                                url: `/${locale}/app/links?l=${accessToken.id}`
                            })).concat(personsAccessTokens.map((accessToken) => ({
                                key: accessToken.id,
                                title: `${accessToken.permission.toString()} - ${accessToken.folder.name}`,
                                url: `/${locale}/app/links?l=${accessToken.id}`
                            })))
                        },
                        {
                            key: "shared-with-me",
                            title: t('main.sharedWithMe'),
                            icon: Folder,
                            url: `/${locale}/app/shared-with-me`,
                            items: sharedWithMeFolders.map((accessToken) => ({
                                key: accessToken.folder.id,
                                title: `${accessToken.folder.createdBy.name} - ${accessToken.folder.name}`,
                                url: `/${locale}/app/folders/${accessToken.folder.id}?share=${accessToken.token}&t=p`
                            })),
                        }
                    ],
                    navSecondaryItems: [
                        ...(me?.role.includes(Role.ADMIN) ? [{
                            title: "Administration",
                            icon: undefined,
                            url: `/${locale}/app/administration`,
                        }] : [])
                    ],
                }} />
                <SidebarInset className="flex-1 max-h-[calc(100svh-theme(spacing.4))]">
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b">
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

                    <div className="flex flex-1 flex-col gap-4 p-4 overflow-auto pt-4">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
            <CommandSearch folders={folders} images={images} />
            <Toaster />
        </NuqsAdapter>
    );
}
