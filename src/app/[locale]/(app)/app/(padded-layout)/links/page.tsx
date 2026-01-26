import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import LinksContent from "@/components/accessTokens/LinksContent";
import { Metadata } from "next";
import { AccessTokenService } from "@/data/access-token-service";
import { FolderService } from "@/data/folder-service";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("metadata.links");
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function LinksPage(props: {
	readonly params: Promise<{ readonly locale: string }>;
	readonly searchParams: Promise<{ readonly s?: "links" | "contacts"; readonly l?: string }>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;

	const { user } = await getCurrentSession();
	if (!user) {
		return redirect({ href: `/signin`, locale: params.locale });
	}

	const accessTokens = await AccessTokenService.getMultiple({
		where: { folder: { createdBy: { id: user.id } } },
		include: { folder: { include: { slugs: { orderBy: { createdAt: "desc" }, take: 1 } } } },
		orderBy: [{ folder: { name: "asc" } }],
	});

	const lightFolders = await FolderService.getMultiple({
		where: { createdBy: { id: user.id } },
		select: {
			id: true,
			name: true,
			slugs: { orderBy: { createdAt: "desc" }, take: 1 },
		},
	});

	const defaultSelectedAccessTokenIndex = accessTokens.map(act => act.id).indexOf(searchParams.l || "");

	return (
		<LinksContent
			side={searchParams.s || "contacts"}
			accessTokens={accessTokens}
			lightFolders={lightFolders}
			defaultSelectedAccessTokenIndex={defaultSelectedAccessTokenIndex}
		/>
	);
}
