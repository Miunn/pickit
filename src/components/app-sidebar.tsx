import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain, NavMainItems } from "@/components/nav-main"
import { NavSecondary, NavSecondaryItems } from "@/components/nav-secondary"
import { NavUser, NavUserItems } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface AppSidebarProps {
  navMainItems: NavMainItems;
  navSecondayrItems: NavSecondaryItems;
  navUserItems: NavUserItems;
}

export function AppSidebar({ items, ...props }: {
  items: AppSidebarProps & React.ComponentProps<typeof Sidebar>
} ) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Pickit</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items.navMainItems} />
        {/*<NavProjects projects={items.nav} />*/}
        <NavSecondary items={items.navSecondayrItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={items.navUserItems} />
      </SidebarFooter>
    </Sidebar>
  )
}
