import UnlockTokenPrompt from "@/components/folders/UnlockTokenPrompt";
import BreadcrumbPortal from "@/components/layout/BreadcrumbPortal";
import HeaderBreadcumb from "@/components/layout/breadcrumb/HeaderBreadcumb";
import { AccessTokenService } from "@/data/access-token-service";
import { redirect } from "@/i18n/navigation";

interface UnlockFolderPageProps {
	readonly params: Promise<{ readonly slug: string; readonly locale: string }>;
	readonly searchParams: Promise<{ readonly share?: string; readonly error?: string }>;
}

export default async function UnlockFolderPage(props: UnlockFolderPageProps) {
	const { locale, slug } = await props.params;
	const { share, error } = await props.searchParams;

	if (!share) {
		return redirect({ href: `/app/folders/${slug}`, locale });
	}

	const accessToken = await AccessTokenService.get({
		where: { token: share },
		select: { folder: { select: { name: true } } },
	});

	if (!accessToken) {
		return redirect({
			href: `/links/invalid/${share}`,
			locale,
		});
	}

	return (
		<>
			<BreadcrumbPortal>
				<HeaderBreadcumb folderName={accessToken.folder.name} />
			</BreadcrumbPortal>
			<UnlockTokenPrompt slug={slug} wrongPin={error === "wrong-pin"} />
		</>
	);
}
