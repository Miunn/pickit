"use client"

import { DataTable } from "@/components/ui/data-table";
import { linksColumns } from "./columns-links";
import CreateAccessTokenDialog from "@/components/accessTokens/CreateAccessTokenDialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, Trash2 } from "lucide-react";
import DeleteAccessTokenDialog from "@/components/accessTokens/DeleteAccessTokenDialog";
import { LightFolder, PersonAccessTokenWithFolder } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { personColumns } from "./columns-persons";

export default function PersonDataTable({ personsAccessTokens, defaultTokenIndex, lightFolders }: { personsAccessTokens: PersonAccessTokenWithFolder[], defaultTokenIndex: number, lightFolders: LightFolder[] }) {

    const [selectedTokensIndexes, setSelectedTokensIndexes] = useState<{ [index: number]: boolean }>(defaultTokenIndex !== -1 ? { [defaultTokenIndex]: true } : {});
    const [selectedTokens, setSelectedTokens] = useState<string[]>(defaultTokenIndex !== -1 ? [personsAccessTokens[defaultTokenIndex].token] : []);
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

    useEffect(() => {
        setSelectedTokens(Object.keys(selectedTokensIndexes).map((k) => personsAccessTokens[parseInt(k)].token));
    }, [selectedTokensIndexes, personsAccessTokens]);

    return (
        <DataTable
            columns={personColumns}
            data={personsAccessTokens}
            selection={selectedTokensIndexes}
            setSelection={setSelectedTokensIndexes}
            filterPlaceholder="Search links"
            filterColumn="folder_name"
            rightHeadingNodes={
                <div className="flex gap-2">
                    <DeleteAccessTokenDialog tokens={selectedTokens} tokensType="persons" openState={deleteOpen} setOpenState={setDeleteOpen} submitNext={() => setSelectedTokensIndexes({})}>
                        <DialogTrigger asChild>
                            <Button variant="outline" disabled={selectedTokens.length === 0} className={(selectedTokens.length === 0) ? "!opacity-0" : "opacity-100"}><Trash2 className="w-4 h-4 mr-2" /> Delete selection</Button>
                        </DialogTrigger>
                    </DeleteAccessTokenDialog>
                </div>
            }
        />
    )
}