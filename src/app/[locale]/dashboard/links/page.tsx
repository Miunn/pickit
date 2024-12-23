import { getAccessTokens } from "@/actions/actions";
import { DataTable } from "@/components/ui/data-table";
import { linksColumns } from "./columns";

export default async function LinksPage({ searchParams }: { searchParams: { l?: string } }) {

    const accessTokens = (await getAccessTokens()).accessTokens;

    const defaultSelectedIndex = accessTokens.map((act) => act.id).indexOf(searchParams.l || "");

    return (
        <div>
            <h3 className="font-semibold">Manage links</h3>

            <DataTable
                columns={linksColumns}
                data={accessTokens}
                defaultSelected={searchParams.l ? { [defaultSelectedIndex]: true } : {}}
            />
        </div>
    )
}