import * as React from "react";
import { type LucideIcon } from "lucide-react";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type NavSecondaryItems = {
	title: string;
	url: string;
	icon?: LucideIcon;
}[];

export function NavSecondary({
	userUsedStorage,
	userMaxStorage,
	items,
	...props
}: {
	readonly userUsedStorage: number;
	readonly userMaxStorage: number;
	readonly items: NavSecondaryItems & React.ComponentPropsWithoutRef<typeof SidebarGroup>;
}) {
	const t = useTranslations("sidebar.secondary");

	return (
		<SidebarGroup className="mt-auto" {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map(item => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild size="sm">
								<a href={item.url}>
									{item.icon ? <item.icon /> : null}
									<span>{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
					<SidebarMenuItem>
						<SidebarMenuButton asChild size="sm" className="items-start">
							<Link
								href={`/app/account/billing`}
								className="h-auto flex flex-col items-start gap-1"
							>
								<p className="text-start">{t("used")}</p>
								<div className="w-full flex items-center gap-2">
									<Progress
										value={
											(Number(userUsedStorage) /
												Number(
													userMaxStorage
												)) *
											100
										}
										className="w-full"
									/>
									<span className="text-nowrap">
										{formatBytes(Number(userUsedStorage))} /{" "}
										{formatBytes(Number(userMaxStorage))}
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
