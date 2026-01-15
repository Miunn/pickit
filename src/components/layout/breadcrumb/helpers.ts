/* Helpers for breadcrumb parsing and trail construction
 *
 * This module contains pure functions that:
 *  - parse a Next.js pathname into a small BreadcrumbPath model
 *  - build a linear trail of items that the component can map over to render
 *
 * The goal is to keep branching and complexity out of the React component.
 */

import { UserAdministration } from "@/lib/definitions";

export type BreadcrumbType =
	| "dashboard"
	| "folders"
	| "images"
	| "folder"
	| "links"
	| "map"
	| "account"
	| "administration"
	| "administrationUsers";

export type BreadcrumbPath = {
	type: BreadcrumbType;
	folderId?: string;
	folderName?: string;
	userId?: string;
};

/**
 * Result returned by parsePathname
 */
export type ParseResult = {
	path: BreadcrumbPath | null;
	userId?: string;
};

/**
 * A trail item describes one render unit for the breadcrumb component.
 * - If `type` is present, the component will translate that key (e.g. "images").
 * - If `label` is present, that explicit label should be rendered (e.g. folder name or user name).
 * - `href` is used for links; `isCurrent` controls whether it's rendered as the current page.
 * - `itemHiddenClass` / `separatorClass` allow preserving responsive classes from the original component.
 */
export type TrailItem = {
	key: string;
	type?: BreadcrumbType;
	label?: string;
	href?: string;
	isCurrent?: boolean;
	itemHiddenClass?: string;
	separatorClass?: string;
};

/**
 * Parse a Next.js pathname into our BreadcrumbPath model.
 *
 * Examples:
 *  - "/en/app" => { path: { type: "dashboard" } }
 *  - "/en/app/folders" => { path: { type: "folders" } }
 *  - "/en/app/folders/123" => { path: { type: "folder", folderId: "123", folderName } }
 *  - "/en/app/administration/users/456" => { path: { type: "administrationUsers", userId: "456" }, userId: "456" }
 *
 * The function strips locale tokens ("en" / "fr") from the tokens list.
 */
export function parsePathname(pathname: string, folderName?: string): ParseResult {
	const tokens = pathname.split("/").filter(path => path && !/^(en|fr)$/.test(path));

	// Expect something like ["app", ...]
	if (tokens[0] !== "app") return { path: null };

	const pathMap: Record<string, BreadcrumbPath> = {
		"": { type: "dashboard" },
		folders: { type: "folders" },
		images: { type: "images" },
		links: { type: "links" },
		map: { type: "map" },
		account: { type: "account" },
		administration: { type: "administration" },
	};

	// app only -> dashboard
	if (tokens.length === 1) {
		return { path: pathMap[""] };
	}

	// app/<route>
	if (tokens.length === 2) {
		return { path: pathMap[tokens[1]] || null };
	}

	// app/folders/<id>
	if (tokens[1] === "folders" && tokens[2]) {
		return { path: { type: "folder", folderId: tokens[2], folderName } };
	}

	// app/administration/users/<id>
	if (tokens[1] === "administration" && tokens[2] === "users" && tokens[3]) {
		return {
			path: { type: "administrationUsers", userId: tokens[3] },
			userId: tokens[3],
		};
	}

	// Unknown pattern
	return { path: null };
}

/**
 * Build a linear trail of TrailItems for rendering.
 *
 * The output is intentionally simple: a flat array the component can map through.
 * This reduces branching inside JSX.
 *
 * - `locale` is used to create hrefs for linking.
 * - `folderName` and `adminUser` are optional contextual values used as labels.
 */
export function buildBreadcrumbTrail(
	currentPath: BreadcrumbPath | null,
	locale: string,
	folderName?: string,
	adminUser?: UserAdministration
): TrailItem[] {
	if (!currentPath) return [];

	const items: TrailItem[] = [];

	// Dashboard always present as first item (linked unless current)
	const dashboardHref = `/${locale}/app/`;
	items.push({
		key: "dashboard",
		type: "dashboard",
		href: dashboardHref,
		isCurrent: currentPath.type === "dashboard",
		itemHiddenClass: "hidden lg:block",
	});

	// If dashboard is current, we return early
	if (currentPath.type === "dashboard") {
		return items;
	}

	// For non-dashboard routes we add the rest of the trail
	switch (currentPath.type) {
		case "folder":
			// Dashboard > Folders > FolderName
			items.push({
				key: "folders",
				type: "folders",
				href: `/${locale}/app/folders`,
				itemHiddenClass: "hidden lg:block",
			});
			items.push({
				key: `folder-${currentPath.folderId ?? "unknown"}`,
				label: folderName ?? currentPath.folderId,
				isCurrent: true,
			});
			break;

		case "administrationUsers":
			// Dashboard > Administration > UserName
			items.push({
				key: "administration",
				type: "administration",
				href: `/${locale}/app/administration`,
				itemHiddenClass: "hidden lg:block",
			});
			items.push({
				key: `admin-user-${currentPath.userId ?? "unknown"}`,
				label: adminUser?.name ?? currentPath.userId,
				isCurrent: true,
			});
			break;

		default:
			// Simple two-item trail: Dashboard > Route
			// For types like images, links, map, account, administration
			items.push({
				key: `${currentPath.type}`,
				type: currentPath.type,
				href: `/${locale}/app/${currentPath.type}`,
				isCurrent: true,
				itemHiddenClass: "hidden lg:block",
			});
			break;
	}

	return items;
}
