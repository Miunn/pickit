"use client";

import { DataTable } from "@/components/ui/data-table";
import { UserAdministration } from "@/lib/definitions";
import { useState } from "react";
import { usersColumns } from "./columns-users";
import { useTranslations } from "next-intl";

export default function UsersDataTable({
    users,
    defaultUserIndex,
}: {
    users: UserAdministration[];
    defaultUserIndex: number;
}) {
    const [selectedUsersIndexes, setSelectedUsersIndexes] = useState<{ [index: number]: boolean }>(
        defaultUserIndex !== -1 ? { [defaultUserIndex]: true } : {}
    );
    const t = useTranslations("dataTables.users.columns");

    return (
        <DataTable
            columns={usersColumns}
            data={users}
            selection={selectedUsersIndexes}
            setSelection={setSelectedUsersIndexes}
            filterPlaceholder="Search users"
            filterColumn="name"
            rightHeadingNodes={<div className="flex gap-2"></div>}
            translations={t}
        />
    );
}
