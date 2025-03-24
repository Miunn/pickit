'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonDataTable from "./person-data-table";
import LinksDataTable from "./links-data-table";
import { useTranslations } from "next-intl";
import { AccessTokenWithFolder, LightFolder, PersonAccessTokenWithFolder } from "@/lib/definitions";
import { useQueryState } from "nuqs";

export interface LinksContentProps {
    side: "links" | "contacts";
    accessTokens: AccessTokenWithFolder[];
    personsAccessTokens: PersonAccessTokenWithFolder[];
    lightFolders: LightFolder[];
    defaultSelectedAccessTokenIndex: number;
    defaultSelectedPersonAccessTokenIndex: number;
}

export default function LinksContent({ side, accessTokens, personsAccessTokens, lightFolders, defaultSelectedAccessTokenIndex, defaultSelectedPersonAccessTokenIndex }: LinksContentProps) {
    
    const t = useTranslations("pages.links");

    const [sideState, setSideState] = useQueryState<"links" | "contacts">("s", {
        parse: (value: string | null) => value as "links" | "contacts",
        defaultValue: side
    })
    
    return (
        <Tabs value={sideState} onValueChange={(value: string) => setSideState(value as "links" | "contacts")}>
        <TabsList>
            <TabsTrigger value="contacts">{t('persons.title')}</TabsTrigger>
            <TabsTrigger value="links">{t('links.title')}</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts">
            <PersonDataTable personsAccessTokens={personsAccessTokens} defaultTokenIndex={defaultSelectedPersonAccessTokenIndex} lightFolders={lightFolders} />
        </TabsContent>
        <TabsContent value="links">
            <LinksDataTable accessTokens={accessTokens} defaultTokenIndex={defaultSelectedAccessTokenIndex} lightFolders={lightFolders} />
        </TabsContent>
    </Tabs>
    )
}