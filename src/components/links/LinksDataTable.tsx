"use client"

import { linksColumns } from "@/components/links/columns";
import { DataTable } from "../ui/data-table";
import { AccessTokenWithFolder } from "@/lib/definitions";

export default function LinksDataTable({ accessTokens }: { accessTokens: AccessTokenWithFolder[] }) {
    return (
        <DataTable columns={linksColumns} data={accessTokens} />
    )
}