"use client";

import { BadgeCheck, Bell, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { SignOut } from "@/actions/authActions";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { UserLight } from "@/lib/definitions";
import { Notification as NotificationData } from "@prisma/client";
import NotificationsDialog from "@/components/notifications/NotificationDialog";
import { useMemo, useState } from "react";

export function NavUser({ user, initialNotifications }: { readonly user: UserLight; readonly initialNotifications: NotificationData[] }) {
    const { isMobile } = useSidebar();
    const locale = useLocale();
    const t = useTranslations("sidebar.user");
    const [notifications, setNotifications] = useState<NotificationData[]>(initialNotifications);
    const unreadCount = useMemo(
        () => notifications.filter(notification => !notification.isRead).length,
        [notifications]
    );
    const [openNotifications, setOpenNotifications] = useState(false);

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div className="relative">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user.image || undefined} alt={user.name} />
                                        <AvatarFallback className="rounded-lg">
                                            {user.name
                                                .split(" ")
                                                .map(token => token[0])
                                                .join("")
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {unreadCount > 0 && (
                                        <div className="w-4 h-4 absolute -top-2 left-full -translate-x-1/2 flex items-center justify-center px-1 py-1 text-[0.625rem] rounded-full bg-primary text-primary-foreground">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                </div>
                                <CaretSortIcon className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user.image || undefined} alt={user.name} />
                                        <AvatarFallback className="rounded-lg">
                                            {user.name
                                                .split(" ")
                                                .map(token => token[0])
                                                .join("")
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user.name}</span>
                                        <span className="truncate text-xs">{user.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <Link href={`/${locale}/app/account`}>
                                    <DropdownMenuItem className="flex gap-2 items-center">
                                        <BadgeCheck className="w-4 h-4" />
                                        {t("account")}
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem className="flex gap-2" onClick={() => setOpenNotifications(true)}>
                                    <div className="relative">
                                        <Bell className="w-4 h-4" />
                                        {unreadCount > 0 && (
                                            <div className="w-4 h-4 absolute -top-2 left-full -translate-x-1/2 flex items-center justify-center px-1 py-1 text-[0.625rem] rounded-full bg-primary text-primary-foreground">
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </div>
                                        )}
                                    </div>
                                    {t("notifications")}
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex gap-2" onClick={() => SignOut()}>
                                <LogOut className="w-4 h-4" />
                                {t("logout")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
            <NotificationsDialog
                notifications={notifications}
                setNotifications={setNotifications}
                open={openNotifications}
                onOpenChange={setOpenNotifications}
            />
        </>
    );
}
