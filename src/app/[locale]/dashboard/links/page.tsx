import { getAccessTokens } from "@/actions/actions";
import { DataTable } from "@/components/ui/data-table";
import { linksColumns } from "./columns";

export default async function LinksPage() {

    const accessTokens = (await getAccessTokens()).accessTokens;

    return (
        <div>
            <h3 className="font-semibold">Manage links</h3>

            <DataTable columns={linksColumns} data={accessTokens} />
        </div>
    )
}