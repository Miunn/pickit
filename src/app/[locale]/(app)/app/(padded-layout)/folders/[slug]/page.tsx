import { FolderContent } from "@/components/folders/FolderContent";
import { FilesSort, FilesSortDefinition } from "@/types/imagesSort";
import { redirect } from "@/i18n/navigation";
import { ViewState } from "@/components/folders/ViewSelector";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import BreadcrumbPortal from "@/components/layout/BreadcrumbPortal";
import HeaderBreadcumb from "@/components/layout/breadcrumb/HeaderBreadcumb";
import { FolderProvider } from "@/context/FolderContext";
import { FilesProvider } from "@/context/FilesContext";
import { TokenProvider } from "@/context/TokenContext";
import { generateV4DownloadUrl } from "@/lib/bucket";
import { AccessTokenService } from "@/data/access-token-service";
import { SecureService } from "@/data/secure/secure-service";
import { FolderSlugsService } from "@/data/folder-slugs-service";
import { permanentRedirect } from "next/navigation";
import { FolderService } from "@/data/folder-service";
import { buildUrl } from "@/lib/utils";

function getSortOrderBy(sort: FilesSortDefinition) {
	switch (sort) {
		case FilesSort.Name.Asc:
			return { name: "asc" as const };
		case FilesSort.Name.Desc:
			return { name: "desc" as const };
		case FilesSort.Size.Asc:
			return { size: "asc" as const };
		case FilesSort.Size.Desc:
			return { size: "desc" as const };
		case FilesSort.Date.Asc:
			return { createdAt: "asc" as const };
		case FilesSort.Date.Desc:
			return { createdAt: "desc" as const };
		case FilesSort.Taken.Asc:
			return { takenAt: "asc" as const };
		case FilesSort.Taken.Desc:
			return { takenAt: "desc" as const };
		case FilesSort.Position:
			return { position: "asc" as const };
		default:
			return { createdAt: "desc" as const };
	}
}

export async function generateMetadata(props: {
	params: Promise<{ slug: string; locale: string }>;
	searchParams: Promise<{
		sort?: FilesSortDefinition;
		view?: ViewState;
		share?: string;
		h?: string;
	}>;
}): Promise<Metadata> {
	const searchParams = await props.searchParams;
	const params = await props.params;
	const t = await getTranslations("metadata.folder");
	let folderNameAndDescription: {
		name: string;
		description?: string | null;
	} | null = null;
	if (!searchParams.share) {
		return {
			title: t("title", { folderName: "Folder" }),
			description: t("description", { folderName: "Folder" }),
			openGraph: {
				title: t("title", { folderName: "Folder" }),
				description: t("description", { folderName: "Folder" }),
			},
		};
	}

	folderNameAndDescription = await AccessTokenService.get({
		where: { token: searchParams.share },
		select: { folder: { select: { name: true, description: true } } },
	}).then(result => (result ? { name: result.folder.name, description: result.folder.description } : null));

	if (!folderNameAndDescription) {
		return {
			title: t("title", { folderName: "Folder" }),
			description: t("description", { folderName: "Folder" }),
			openGraph: {
				title: t("openGraph.title", { folderName: "Folder" }),
				description: t("openGraph.description", { folderName: "Folder" }),
			},
		};
	}

	return {
		title: t("title", { folderName: folderNameAndDescription.name }),
		description: folderNameAndDescription.description
			? folderNameAndDescription.description
			: t("description", { folderName: folderNameAndDescription.name }),
		openGraph: {
			title: t("openGraph.title", {
				folderName: folderNameAndDescription.name,
			}),
			description: folderNameAndDescription.description
				? folderNameAndDescription.description
				: t("openGraph.description", {
						folderName: folderNameAndDescription.name,
					}),
			images: [
				{
					alt: "Echomori",
					url: `${process.env.NEXT_PUBLIC_APP_URL}/api/folders/${params.slug}/og?share=${searchParams.share}&h=${searchParams.h}`,
					type: "image/png",
					width: 1200,
					height: 630,
				},
			],
		},
	};
}

/**
 * Render the folder page for the given route and query parameters, handling access checks, shared-token flows, and signed file URLs.
 *
 * This server component:
 * - Verifies access to the folder and redirects for denied or invalid shared links.
 * - Loads folder data (including files, relations, tags, cover, and counts).
 * - Resolves an access token when a share token is provided and enforces PIN/unlock flows.
 * - Increments token usage for shared views and generates V4 signed download URLs for each file.
 * - Provides folder, token, and files context providers and renders the folder content UI.
 *
 * @param props.params - Route parameters containing `folderId` and `locale`.
 * @param props.searchParams - Query parameters that may include:
 *   - `sort` — images sort method
 *   - `view` — preferred view state
 *   - `share` — share token string
 *   - `t` — (unused here) timestamp or token-related query
 *   - `h` — token hash used for validation
 *   - `codeNeeded` — whether a code is required (from client)
 *   - `wrongPin` — whether a previously provided PIN was incorrect
 * @returns The React element for the folder page, or a redirect response when access is denied, a share link is invalid, or the folder is not found.
 */
export default async function FolderPage(props: {
	readonly params: Promise<{ readonly slug: string; readonly locale: string }>;
	readonly searchParams: Promise<{
		readonly sort?: FilesSortDefinition;
		readonly view?: ViewState;
		readonly share?: string;
		readonly t?: string;
		readonly h?: string;
		readonly codeNeeded?: boolean;
		readonly wrongPin?: boolean;
	}>;
}) {
	const { locale, slug } = await props.params;
	const { share, h, sort, view } = await props.searchParams;

	const lightSlug = await FolderSlugsService.get({
		where: { slug },
		select: { folderId: true },
	});

	// Id fallback
	const folderId = await FolderService.get({
		where: { id: slug },
		select: { id: true },
	});

	const resolvedFolderId = lightSlug?.folderId ?? folderId?.id;

	if (!resolvedFolderId) {
		return redirect({ href: "/app/folders", locale: locale });
	}

	const currentFolderSlug = await FolderService.get({
		where: { id: resolvedFolderId },
		select: { slug: true },
	});

	if (!currentFolderSlug) {
		return redirect({ href: "/app/folders", locale: locale });
	}

	// Permanent redirect to the latest slug if the current slug is outdated
	if (currentFolderSlug.slug !== slug) {
		const url = buildUrl(
			`${process.env.NEXT_PUBLIC_APP_URL}/${locale}/app/folders/${currentFolderSlug.slug}`,
			{
				share,
				sort,
				view,
				h,
			}
		);

		return permanentRedirect(url.toString());
	}

	const folder = await FolderService.get({
		where: { slug },
		include: {
			files: {
				include: {
					folder: {
						include: {
							_count: { select: { files: true } },
							tags: true,
							slugs: {
								orderBy: { createdAt: "desc" },
								take: 1,
							},
						},
					},
					comments: { include: { createdBy: true } },
					likes: true,
					tags: true,
				},
				orderBy: getSortOrderBy(sort || FilesSort.Position),
			},
			createdBy: true,
			accessTokens: true,
			tags: true,
			_count: { select: { files: true } },
			cover: true,
			slugs: {
				orderBy: { createdAt: "desc" },
				take: 1,
			},
		},
	});

	if (!folder) {
		return redirect({ href: "/app/folders", locale: locale });
	}

	const auth = await SecureService.folder.enforce(folder, share, h);

	if (!auth.allowed) {
		if (auth.reason === "invalid-pin") {
			return redirect({
				href: `/app/folders/${slug}/unlock?share=${share}`,
				locale,
			});
		}

		if (share) {
			return redirect({
				href: `/links/invalid/${share}`,
				locale,
			});
		}

		return redirect({ href: "/app/folders", locale: locale });
	}

	let accessToken = null;

	if (share) {
		accessToken = await AccessTokenService.get({
			where: { token: share },
			include: { folder: true },
		});

		fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tokens/increment?token=${share}`);
	}

	const filesWithSignedUrls = await Promise.all(
		folder.files.map(async file => ({
			...file,
			signedUrl: await generateV4DownloadUrl(`${file.createdById}/${file.folderId}/${file.id}`),
		}))
	);

	return (
		<>
			<BreadcrumbPortal>
				<HeaderBreadcumb folderName={folder.name} />
			</BreadcrumbPortal>
			<FolderProvider
				folderData={folder}
				tokenData={accessToken}
				tokenHash={h ?? null}
				isShared={folder.accessTokens.some(token => token.email)}
			>
				<TokenProvider token={accessToken}>
					<FilesProvider
						filesData={filesWithSignedUrls}
						defaultView={view || ViewState.Grid}
					>
						<FolderContent />
					</FilesProvider>
				</TokenProvider>
			</FolderProvider>
		</>
	);
}
