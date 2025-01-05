import * as React from "react"
import { Command } from "lucide-react"

import { NavMain, NavMainItems } from "@/components/nav-main"
import { NavSecondary, NavSecondaryItems } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import CreateFolderDialog from "./folders/CreateFolderDialog"
import { DialogTrigger } from "./ui/dialog"
import { UserLight } from "@/lib/definitions"
import Link from "next/link"
import { useTranslations } from "next-intl"

export interface AppSidebarProps {
  navMainItems: NavMainItems;
  navSecondayrItems: NavSecondaryItems;
}

export function AppSidebar({ locale, user, items, ...props }: {
  locale: string, user?: UserLight | null, items: AppSidebarProps & React.ComponentProps<typeof Sidebar>
}) {
  
  const t = useTranslations("sidebar");

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/${locale}/dashboard`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{ t('title') }</span>
                  <span className="truncate text-xs">{ t('message') }</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            {user && <CreateFolderDialog>
              <DialogTrigger asChild>
                <Button variant={"outline"} className="w-full">New folder</Button>
              </DialogTrigger>
            </CreateFolderDialog>}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items.navMainItems} />
        {/*<NavProjects projects={items.nav} />*/}
      </SidebarContent>
      <SidebarFooter>
        {user ? <NavSecondary locale={locale} userUsedStorage={user.usedStorage} items={items.navSecondayrItems} /> : null}
        {user ? <NavUser user={user} /> : <Button variant={"outline"} className="w-full" asChild><Link href={`/${locale}/signin`}>Sign in</Link></Button>}
      </SidebarFooter>
    </Sidebar>
  )
}
