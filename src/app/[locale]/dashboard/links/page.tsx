import { getAccessTokens } from "@/actions/accessTokens";
import { DataTable } from "@/components/ui/data-table";
import { linksColumns } from "./columns";
import CreateAccessTokenDialog from "@/components/accessTokens/CreateAccessTokenDialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { getLightFolders } from "@/actions/folders";

export default async function LinksPage({ searchParams }: { searchParams: { l?: string } }) {

    const accessTokens = (await getAccessTokens()).accessTokens;
    const lightFolders = (await getLightFolders()).lightFolders

    const defaultSelectedIndex = accessTokens.map((act) => act.id).indexOf(searchParams.l || "");

    return (
        <div>
            <h3 className="font-semibold">Manage links</h3>

            <DataTable
                columns={linksColumns}
                data={accessTokens}
                defaultSelected={searchParams.l ? { [defaultSelectedIndex]: true } : {}}
                rightHeadingNodes={
                    <>
                    <CreateAccessTokenDialog folders={lightFolders}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Link className="w-4 h-4 mr-2" /> New link</Button>
                        </DialogTrigger>
                    </CreateAccessTokenDialog>
                    </>
                }
            />
        </div>
    )
}