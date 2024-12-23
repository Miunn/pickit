import { getAccessTokens } from "@/actions/actions";
import LinksDataTable from "@/components/links/LinksDataTable";

export default async function LinksPage() {

    const accessTokens = (await getAccessTokens()).accessTokens;

    return (
        <div>
            <h3 className="font-semibold">Manage links</h3>

            <LinksDataTable accessTokens={accessTokens} />
        </div>
    )
}