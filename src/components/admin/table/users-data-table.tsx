"use client";

import { DataTable } from "@/components/ui/data-table";
import { UserAdministration } from "@/lib/definitions";
import { useState } from "react";
import { usersColumns } from "@/components/admin/table/columns-users";
import { useTranslations } from "next-intl";

export default function UsersDataTable({
    users,
    defaultUserIndex,
}: {
    readonly users: UserAdministration[];
    readonly defaultUserIndex: number;
}) {
    const [selectedUsersIndexes, setSelectedUsersIndexes] = useState<{ [index: number]: boolean }>({
        [defaultUserIndex]: true,
    });
    const [deleteOpen, setDeleteOpen] = useState(false);
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
            states={{ deleteOpen, setDeleteOpen }}
        />
    );
}
