"use client";

import { usePathname } from "next/navigation";
import HeaderBreadcumb from "@/components/layout/breadcrumb/HeaderBreadcumb";

export default function BreadcrumbWrapper() {
	const pathname = usePathname();
	const shouldHideDefaultBreadcrumb =
		pathname?.includes("/app/folders/") || pathname?.includes("/app/administration/users/");

	if (shouldHideDefaultBreadcrumb) return null;

	return <HeaderBreadcumb />;
}
