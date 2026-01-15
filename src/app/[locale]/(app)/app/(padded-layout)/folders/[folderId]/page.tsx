import { FolderContent } from "@/components/folders/FolderContent";
import { ImagesSortMethod } from "@/types/imagesSort";
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
import { FolderService } from "@/data/folder-service";
import { SecureService } from "@/data/secure/secure-service";

function getSortOrderBy(sort: ImagesSortMethod) {
	switch (sort) {
		case ImagesSortMethod.NameAsc:
			return { name: "asc" as const };
		case ImagesSortMethod.NameDesc:
			return { name: "desc" as const };
		case ImagesSortMethod.SizeAsc:
			return { size: "asc" as const };
		case ImagesSortMethod.SizeDesc:
			return { size: "desc" as const };
		case ImagesSortMethod.DateAsc:
			return { createdAt: "asc" as const };
		case ImagesSortMethod.DateDesc:
			return { createdAt: "desc" as const };
		case ImagesSortMethod.TakenAsc:
			return { takenAt: "asc" as const };
		case ImagesSortMethod.TakenDesc:
			return { takenAt: "desc" as const };
		case ImagesSortMethod.PositionAsc:
			return { position: "asc" as const };
		case ImagesSortMethod.PositionDesc:
			return { position: "desc" as const };
		default:
			return { createdAt: "desc" as const };
	}
}

export async function generateMetadata(props: {
	params: Promise<{ folderId: string; locale: string }>;
	searchParams: Promise<{
		sort?: ImagesSortMethod;
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
					url: `${process.env.NEXT_PUBLIC_APP_URL}/api/folders/${params.folderId}/og?share=${searchParams.share}&h=${searchParams.h}`,
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
	readonly params: Promise<{ readonly folderId: string; readonly locale: string }>;
	readonly searchParams: Promise<{
		readonly sort?: ImagesSortMethod;
		readonly view?: ViewState;
		readonly share?: string;
		readonly t?: string;
		readonly h?: string;
		readonly codeNeeded?: boolean;
		readonly wrongPin?: boolean;
	}>;
}) {
	const { locale, folderId } = await props.params;
	const { share, h, sort, view } = await props.searchParams;

	const folder = await FolderService.get({
		where: { id: folderId },
		include: {
			files: {
				include: {
					folder: {
						include: { _count: { select: { files: true } }, tags: true },
					},
					comments: { include: { createdBy: true } },
					likes: true,
					tags: true,
				},
				orderBy: getSortOrderBy(sort || ImagesSortMethod.DateDesc),
			},
			createdBy: true,
			accessTokens: true,
			tags: true,
			_count: { select: { files: true } },
			cover: true,
		},
	});

	if (!folder) {
		return redirect({ href: "/folders", locale: locale });
	}

	const auth = await SecureService.folder.enforce(folder, share, h);

	if (!auth.allowed && auth.reason === "invalid-pin") {
		return redirect({
			href: `/app/folders/${folderId}/unlock?share=${share}`,
			locale,
		});
	}

	if (!auth.allowed) {
		if (share) {
			return redirect({
				href: `/links/invalid/${share}`,
				locale,
			});
		}

		return redirect({ href: "/folders", locale: locale });
	}

	let accessToken = null;

	if (share) {
		accessToken = await AccessTokenService.get({
			where: { token: share },
			include: { folder: true },
		});
	}

	if (share) {
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
