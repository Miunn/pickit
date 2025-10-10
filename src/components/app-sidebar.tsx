import * as React from "react";

import { NavMain, NavMainItems } from "@/components/nav-main";
import { NavSecondary, NavSecondaryItems } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import CreateFolderDialog from "./folders/CreateFolderDialog";
import { DialogTrigger } from "./ui/dialog";
import { UserLight } from "@/lib/definitions";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LogoImage from "./generic/LogoImage";
import { Notification as NotificationData } from "@prisma/client";

export interface AppSidebarProps {
    navMainItems: NavMainItems;
    navSecondaryItems: NavSecondaryItems;
}

export function AppSidebar({
    locale,
    user,
    notifications,
    items,
    ...props
}: {
    locale: string;
    user?: UserLight | null;
    notifications: NotificationData[];
    items: AppSidebarProps & React.ComponentProps<typeof Sidebar>;
}) {
    const t = useTranslations("sidebar");
    const createFolderTranslations = useTranslations("dialogs.folders.create");

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={`/${locale}/app`}>
                                <div className="flex aspect-square items-center justify-center rounded-lg text-sidebar-primary-foreground">
                                    <LogoImage size="small" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate text-primary font-semibold">{t("title")}</span>
                                    <span className="truncate text-xs" title={t("message")}>
                                        {t("message")}
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {user && (
                            <CreateFolderDialog>
                                <DialogTrigger asChild>
                                    <Button variant={"outline"} className="w-full">
                                        {createFolderTranslations("trigger")}
                                    </Button>
                                </DialogTrigger>
                            </CreateFolderDialog>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={items.navMainItems} />
                {/*<NavProjects projects={items.nav} />*/}
            </SidebarContent>
            <SidebarFooter>
                {user ? (
                    <NavSecondary
                        userUsedStorage={user.usedStorage}
                        userMaxStorage={user.maxStorage}
                        items={items.navSecondaryItems}
                    />
                ) : null}
                {user ? (
                    <NavUser user={user} initialNotifications={notifications} />
                ) : (
                    <Button variant={"outline"} className="w-full" asChild>
                        <Link href={`/${locale}/signin`}>Sign in</Link>
                    </Button>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
