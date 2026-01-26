import DashboardContent from "@/components/pages/dashboard/DashboardContent";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FilesProvider } from "@/context/FilesContext";
import { TokenProvider } from "@/context/TokenContext";

import { ViewState } from "@/components/folders/ViewSelector";
import { FolderService } from "@/data/folder-service";
import { FileService } from "@/data/file-service";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("metadata.dashboard");
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function Home(props: { readonly params: Promise<{ readonly locale: string }> }) {
	const params = await props.params;

	const { user } = await getCurrentSession();

	if (!user) {
		return redirect({ href: "/signin", locale: params.locale });
	}

	const lastFolders = await FolderService.getMultiple({
		where: {
			createdBy: { id: user.id },
		},
		include: {
			cover: true,
			accessTokens: true,
			files: {
				include: {
					folder: {
						include: { _count: { select: { files: true } }, tags: true },
					},
					comments: { include: { createdBy: true } },
					tags: true,
				},
			},
			slugs: { orderBy: [{ createdAt: "desc" }], take: 1 },
			_count: { select: { files: true } },
		},
		orderBy: [{ updatedAt: "desc" }],
		take: 6,
	});
	const lastFiles = (
		await FileService.getMultiple({
			where: {
				createdBy: { id: user.id },
			},
			orderBy: [{ updatedAt: "desc" }],
			include: {
				folder: {
					include: {
						_count: { select: { files: true } },
						tags: true,
						slugs: { orderBy: [{ createdAt: "desc" }], take: 1 },
					},
				},
				comments: { include: { createdBy: true } },
				likes: true,
				tags: true,
			},
			take: 6,
		})
	)
		.sort((a, b) => {
			return (b.updatedAt as Date).getTime() - (a.updatedAt as Date).getTime();
		})
		.slice(0, 6);

	return (
		<TokenProvider token={null}>
			<FilesProvider filesData={lastFiles} defaultView={ViewState.Grid}>
				<DashboardContent lastFolders={lastFolders} />
			</FilesProvider>
		</TokenProvider>
	);
}
