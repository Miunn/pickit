import FilesMap from "@/components/map/FilesMap";
import { redirect } from "@/i18n/navigation";
import { generateV4DownloadUrl } from "@/lib/bucket";
import { FilesProvider } from "@/context/FilesContext";
import { TokenProvider } from "@/context/TokenContext";
import { ViewState } from "@/components/folders/ViewSelector";
import { FileService } from "@/data/file-service";
import { AccessTokenService } from "@/data/access-token-service";
import { SecureService } from "@/data/secure/secure-service";

export default async function MapPage(props: {
	readonly params: Promise<{ readonly locale: string }>;
	readonly searchParams: Promise<{ readonly share?: string; readonly h?: string; readonly t?: string }>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;

	const { isAllowed, session } = await SecureService.map.enforce(searchParams.share, searchParams.h);

	if (!isAllowed) {
		return redirect({ href: "/signin", locale: params.locale });
	}

	let files = [];
	let accessToken = null;
	// Get files from share token
	if (searchParams.share) {
		accessToken = await AccessTokenService.get({
			where: { token: searchParams.share },
		});

		if (!accessToken) {
			return redirect({ href: "/app/map", locale: params.locale });
		}

		files = await FileService.getMultiple({
			where: { folderId: accessToken.folderId },
			include: {
				comments: { include: { createdBy: true } },
				likes: true,
				folder: {
					include: {
						_count: { select: { files: true } },
						tags: true,
						slugs: { orderBy: { createdAt: "desc" }, take: 1 },
					},
				},
				tags: true,
			},
		});
	} else if (session?.user) {
		files = await FileService.getMultiple({
			where: { createdBy: { id: session.user.id } },
			include: {
				comments: { include: { createdBy: true } },
				likes: true,
				folder: {
					include: {
						_count: { select: { files: true } },
						tags: true,
						slugs: { orderBy: { createdAt: "desc" }, take: 1 },
					},
				},
				tags: true,
			},
		});
	} else {
		return redirect({ href: "/signin", locale: params.locale });
	}

	const filesWithSignedUrlsAndFolders = await Promise.all(
		files.map(async file => ({
			...file,
			signedUrl: await generateV4DownloadUrl(`${file.createdById}/${file.folderId}/${file.id}`),
		}))
	);

	return (
		<div className="rounded-b-xl h-full overflow-hidden">
			<TokenProvider token={accessToken}>
				<FilesProvider filesData={filesWithSignedUrlsAndFolders} defaultView={ViewState.Grid}>
					<FilesMap />
				</FilesProvider>
			</TokenProvider>
		</div>
	);
}
