import { getUsers } from "@/actions/userAdministration";
import UsersDataTable from "./users-data-table";

export default async function AdminHome({ searchParams }: { searchParams: { u?: string } }) {
    
    const users = (await getUsers()).users;
    
    return (
        <div>
            <UsersDataTable
                users={users}
                defaultUserIndex={searchParams.u ? users.findIndex(u => u.id === searchParams.u) : -1}
            />
        </div>
    );
}