import { getAccessTokens } from "@/actions/accessTokens";
import { getLightFolders } from "@/actions/folders";
import LinksDataTable from "./links-data-table";
import PersonDataTable from "./person-data-table";
import { getPersonsAccessTokens } from "@/actions/accessTokensPerson";
import { getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/routing";

export default async function LinksPage({ searchParams }: { searchParams: { s?: string, l?: string } }) {

    const { user } = await getCurrentSession();
    if (!user) {
        return redirect(`/signin`);
    }

    const t = await getTranslations("pages.links");
    const accessTokens = (await getAccessTokens()).accessTokens;
    const personsAccessTokens = (await getPersonsAccessTokens()).personAccessTokens;

    const lightFolders = (await getLightFolders()).lightFolders

    const side = searchParams.s === "links" ? "links" : "persons";
    const defaultSelectedAccessTokenIndex = accessTokens.map((act) => act.id).indexOf(searchParams.l || "");
    const defaultSelectedPersonAccessTokenIndex = personsAccessTokens.map((act) => act.id).indexOf(searchParams.l || "");

    return (
        <Tabs defaultValue={side}>
            <TabsList>
                <TabsTrigger value="persons">{t('persons.title')}</TabsTrigger>
                <TabsTrigger value="links">{t('links.title')}</TabsTrigger>
            </TabsList>
            <TabsContent value="persons">
                <PersonDataTable personsAccessTokens={personsAccessTokens} defaultTokenIndex={defaultSelectedPersonAccessTokenIndex} lightFolders={lightFolders} />
            </TabsContent>
            <TabsContent value="links">
                <LinksDataTable accessTokens={accessTokens} defaultTokenIndex={defaultSelectedAccessTokenIndex} lightFolders={lightFolders} />
            </TabsContent>
        </Tabs>
    )
}