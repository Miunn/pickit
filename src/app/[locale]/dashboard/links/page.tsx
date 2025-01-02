import { getAccessTokens } from "@/actions/accessTokens";
import { getLightFolders } from "@/actions/folders";
import LinksDataTable from "./links-data-table";
import PersonDataTable from "./person-data-table";
import { getPersonsAccessTokens } from "@/actions/accessTokensPerson";

export default async function LinksPage({ searchParams }: { searchParams: { l?: string } }) {

    const accessTokens = (await getAccessTokens()).accessTokens;
    const personsAccessTokens = (await getPersonsAccessTokens()).personAccessTokens;

    const lightFolders = (await getLightFolders()).lightFolders

    const defaultSelectedIndex = accessTokens.map((act) => act.id).indexOf(searchParams.l || "");

    return (
        <div>
            <h3 className="font-semibold">Manage links</h3>

            <LinksDataTable accessTokens={accessTokens} defaultTokenIndex={defaultSelectedIndex} lightFolders={lightFolders}/>

            <h3 className="font-semibold">Manage persons</h3>

            <PersonDataTable personsAccessTokens={personsAccessTokens} defaultTokenIndex={defaultSelectedIndex} lightFolders={lightFolders}/>
        </div>
    )
}