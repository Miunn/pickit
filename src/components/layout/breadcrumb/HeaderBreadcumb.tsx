"use client";

import { Fragment, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "../../ui/breadcrumb";
import { UserAdministration } from "@/lib/definitions";
import { useLocale, useTranslations } from "next-intl";
import { parsePathname, buildBreadcrumbTrail } from "./helpers";

export default function HeaderBreadcumb({
	folderName,
	adminUser,
}: {
	readonly folderName?: string;
	readonly adminUser?: UserAdministration;
}) {
	const locale = useLocale();
	const pathname = usePathname();
	const t = useTranslations("breadcumb");

	const { path: currentPath } = useMemo(() => parsePathname(pathname, folderName), [pathname, folderName]);

	const trail = useMemo(
		() => buildBreadcrumbTrail(currentPath ?? null, locale, folderName, adminUser),
		[currentPath, locale, folderName, adminUser]
	);

	if (!trail.length) return null;

	console.log("Trail", trail);
	return (
		<Breadcrumb>
			<BreadcrumbList>
				{trail.map((item, idx) => {
					if (idx === trail.length - 1) {
						return (
							<BreadcrumbItem key={item.key}>
								<BreadcrumbPage>
									{item.type ? t(item.type) : item.label}
								</BreadcrumbPage>
							</BreadcrumbItem>
						);
					}

					return (
						<Fragment key={item.key}>
							<BreadcrumbLink
								href={
									item.href ??
									`/${locale}/app/${item.type === "dashboard" ? "" : item.type}`
								}
							>
								{item.type ? t(item.type) : item.label}
							</BreadcrumbLink>
							<BreadcrumbSeparator className="hidden lg:block" />
						</Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
