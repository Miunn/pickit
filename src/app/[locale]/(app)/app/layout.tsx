import type { Metadata } from "next";
import "../../../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getTranslations } from "next-intl/server";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Folder, Image, Link, Map } from "lucide-react";
import BreadcrumbWrapper from "@/components/layout/BreadcrumbWrapper";
import UnverifiedEmail from "@/components/layout/UnverifiedEmail";
import { addDays } from "date-fns";
import SwitchLocale from "@/components/generic/SwitchLocale";
import { Notification, Role } from "@prisma/client";
import { getCurrentSession } from "@/lib/session";
import { CommandSearch } from "@/components/generic/CommandSearch";
import { NuqsAdapter } from "nuqs/adapters/react";
import { SwitchTheme } from "@/components/generic/SwitchTheme";
import SessionProvider from "@/providers/SessionProvider";
import { FolderService } from "@/data/folder-service";
import { FileService } from "@/data/file-service";
import { AccessTokenService } from "@/data/access-token-service";
import LinkIcon from "@/components/links/LinkIcon";

export const metadata: Metadata = {
	title: "Echomori",
	description: "Upload and share images with ease.",
};

export default async function LocaleLayout(
	props: Readonly<{
		children: React.ReactNode;
		params: Promise<{ locale: string }>;
		searchParams: { share?: string; h?: string; t?: string };
	}>
) {
	const params = await props.params;

	const { locale } = params;

	const { children } = props;

	const { user, session } = await getCurrentSession();

	const t = await getTranslations("sidebar");
	const notifications: Notification[] = []; /*user
        ? await prisma.notification.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
          })
        :*/
	const folders = user
		? await FolderService.getMultiple({
				where: { createdBy: { id: user.id } },
				select: { id: true, name: true, slug: true },
			})
		: [];
	const files = user
		? await FileService.getMultiple({
				where: { createdBy: { id: user.id } },
				select: {
					id: true,
					name: true,
					folder: {
						select: {
							id: true,
							name: true,
							slug: true,
						},
					},
				},
				orderBy: [{ folder: { name: "asc" } }, { name: "asc" }],
			})
		: [];
	const accessTokens = user
		? await AccessTokenService.getMultiple({
				where: { folder: { createdBy: { id: user.id } } },
				include: { folder: true },
				orderBy: [{ folder: { name: "asc" } }],
			})
		: [];
	const sharedWithMeFolders = user
		? await AccessTokenService.getMultiple({
				where: { email: user.email },
				include: { folder: { include: { createdBy: true } } },
			})
		: [];

	return (
		<NuqsAdapter>
			<SessionProvider user={user} session={session}>
				<SidebarProvider defaultOpen={!!user}>
					<AppSidebar
						locale={locale}
						user={user}
						notifications={notifications}
						items={{
							navMainItems: [
								{
									key: "folders",
									title: t("main.folders"),
									icon: Folder,
									url: `/${locale}/app/folders`,
									isActive: true,
									items: folders.map(folder => ({
										key: folder.id,
										title: folder.name,
										url: `/${locale}/app/folders/${folder.slug}`,
									})),
								},
								{
									key: "files",
									title: t("main.images"),
									icon: Image,
									url: `/${locale}/app/files`,
									items: files.map(file => ({
										key: file.id,
										title: `${file.folder.name} - ${file.name}`,
										url: `/${locale}/app/folders/${file.folder.slug}#${file.id}`,
									})),
								},
								{
									key: "links",
									title: t("main.links"),
									icon: Link,
									url: `/${locale}/app/links`,
									items: accessTokens.map(accessToken => ({
										key: accessToken.id,
										icon: (
											<LinkIcon
												permission={
													accessToken.permission
												}
											/>
										),
										title: `${accessToken.folder.name}`,
										url: `/${locale}/app/links?l=${accessToken.id}`,
									})),
								},
								{
									key: "map",
									title: t("main.map"),
									icon: Map,
									url: `/${locale}/app/map`,
								},
								{
									key: "shared-with-me",
									title: t("main.sharedWithMe"),
									icon: Folder,
									url: `/${locale}/app/shared-with-me`,
									items: sharedWithMeFolders.map(accessToken => ({
										key: accessToken.folder.id,
										title: `${accessToken.folder.createdBy.name} - ${accessToken.folder.name}`,
										url: `/${locale}/app/folders/${accessToken.folder.slug}?share=${accessToken.token}&t=p`,
									})),
								},
							],
							navSecondaryItems: [
								...(user?.role.includes(Role.ADMIN)
									? [
											{
												title: "Administration",
												icon: undefined,
												url: `/${locale}/app/administration`,
											},
										]
									: []),
							],
						}}
					/>
					<SidebarInset className="flex-1 max-h-[calc(100svh-theme(spacing.4))]">
						<header className="flex h-16 shrink-0 items-center gap-2 border-b">
							<div className="w-full flex justify-between items-center px-4">
								<div className="flex items-center gap-2">
									<SidebarTrigger className="-ml-1" />
									<Separator
										orientation="vertical"
										className="mr-2 h-4"
									/>
									<div id="breadcrumb-container">
										<BreadcrumbWrapper />
									</div>
								</div>
								<div>
									<SwitchLocale
										locale={locale}
										className="text-xs"
									/>
									<SwitchTheme />
								</div>
							</div>
						</header>
						{user?.emailVerified === false ? (
							<UnverifiedEmail
								locale={locale}
								userDeletionDate={
									user.emailVerificationDeadline ||
									addDays(user.createdAt, 7)
								}
							/>
						) : null}

						<div className="flex flex-1 flex-col gap-4 overflow-auto">
							{children}
						</div>
					</SidebarInset>
				</SidebarProvider>
			</SessionProvider>
			<CommandSearch folders={folders} files={files} />
			<Toaster />
		</NuqsAdapter>
	);
}
