"use client"

import { DataTable } from "@/components/ui/data-table";
import { UserAdministration } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { usersColumns } from "./columns-users";

export default function UsersDataTable({ users, defaultUserIndex }: { users: UserAdministration[], defaultUserIndex: number }) {

    const [selectedUsersIndexes, setSelectedUsersIndexes] = useState<{ [index: number]: boolean }>(defaultUserIndex !== -1 ? { [defaultUserIndex]: true } : {});
    const [selectedUsers, setSelectedUsers] = useState<string[]>(defaultUserIndex !== -1 ? [users[defaultUserIndex].id] : []);

    useEffect(() => {
        setSelectedUsers(Object.keys(selectedUsersIndexes).map((k) => users[parseInt(k)].id));
    }, [selectedUsersIndexes, users]);

    return (
        <DataTable
            columns={usersColumns}
            data={users}
            selection={selectedUsersIndexes}
            setSelection={setSelectedUsersIndexes}
            filterPlaceholder="Search users"
            filterColumn="name"
            rightHeadingNodes={
                <div className="flex gap-2">
                    
                </div>
            }
        />
    )
}