import * as React from "react"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Progress } from "./ui/progress";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";

export type NavSecondaryItems = {
  title: string
  url: string
  icon: LucideIcon
}[];


export function NavSecondary({
  locale,
  userUsedStorage,
  items,
  ...props
}: { locale: string, userUsedStorage: number, items: NavSecondaryItems & React.ComponentPropsWithoutRef<typeof SidebarGroup> }) {
  return (
    <SidebarGroup className="mt-auto" {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" className="items-start">
              <Link href={`/dashboard/account`} className="h-auto flex flex-col items-start gap-1">
                <p className="text-start">Used storage</p>
                <div className="w-full flex items-center gap-2">
                  <Progress value={userUsedStorage / 10000000} className="w-full" />
                  <span className="text-nowrap">{formatBytes(userUsedStorage)} / 10 GB</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
