"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { FolderWithLastSlug, LightFolder } from "@/lib/definitions";
import { useQueryState } from "nuqs";
import PersonDataTable from "@/components/links/person-data-table";
import LinksDataTable from "@/components/links/links-data-table";
import { AccessToken } from "@prisma/client";

export interface LinksContentProps {
	readonly side: "links" | "contacts";
	readonly accessTokens: (AccessToken & { folder: FolderWithLastSlug })[];
	readonly lightFolders: LightFolder[];
	readonly defaultSelectedAccessTokenIndex: number;
}

export default function LinksContent({
	side,
	accessTokens,
	lightFolders,
	defaultSelectedAccessTokenIndex,
}: LinksContentProps) {
	const t = useTranslations("pages.links");

	const [sideState, setSideState] = useQueryState<"links" | "contacts">("s", {
		parse: (value: string | null) => (value === "links" ? "links" : "contacts"),
		defaultValue: side,
	});

	return (
		<Tabs
			value={sideState}
			onValueChange={(value: string) => setSideState(value === "links" ? "links" : "contacts")}
		>
			<TabsList>
				<TabsTrigger value="contacts">{t("persons.title")}</TabsTrigger>
				<TabsTrigger value="links">{t("links.title")}</TabsTrigger>
			</TabsList>
			<TabsContent value="contacts">
				<PersonDataTable
					accessTokens={accessTokens.filter(token => token.email)}
					defaultTokenIndex={defaultSelectedAccessTokenIndex}
				/>
			</TabsContent>
			<TabsContent value="links">
				<LinksDataTable
					accessTokens={accessTokens.filter(token => !token.email)}
					defaultTokenIndex={defaultSelectedAccessTokenIndex}
					lightFolders={lightFolders}
				/>
			</TabsContent>
		</Tabs>
	);
}
