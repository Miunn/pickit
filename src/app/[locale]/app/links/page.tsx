import { getAccessTokens } from "@/actions/accessTokens";
import { getLightFolders } from "@/actions/folders";
import { getPersonsAccessTokens } from "@/actions/accessTokensPerson";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import LinksContent from "@/components/accessTokens/LinksContent";

export default async function LinksPage({ params, searchParams }: { params: { locale: string }, searchParams: { s?: "links" | "contacts", l?: string } }) {

    const { user } = await getCurrentSession();
    if (!user) {
        return redirect({ href: `/signin`, locale: params.locale });
    }

    const t = await getTranslations("pages.links");
    const accessTokens = (await getAccessTokens()).accessTokens;
    const personsAccessTokens = (await getPersonsAccessTokens()).personAccessTokens;

    const lightFolders = (await getLightFolders()).lightFolders

    const defaultSelectedAccessTokenIndex = accessTokens.map((act) => act.id).indexOf(searchParams.l || "");
    const defaultSelectedPersonAccessTokenIndex = personsAccessTokens.map((act) => act.id).indexOf(searchParams.l || "");

    return (
        <LinksContent
            side={searchParams.s || "contacts"}
            accessTokens={accessTokens}
            personsAccessTokens={personsAccessTokens}
            lightFolders={lightFolders}
            defaultSelectedAccessTokenIndex={defaultSelectedAccessTokenIndex}
            defaultSelectedPersonAccessTokenIndex={defaultSelectedPersonAccessTokenIndex}
        />
    )
}