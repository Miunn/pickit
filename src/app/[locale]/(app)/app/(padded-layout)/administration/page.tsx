import UsersDataTable from "@/components/admin/table/users-data-table";
import { UserService } from "@/data/user-service";

export default async function AdminHome(props: { readonly searchParams: Promise<{ readonly u?: string }> }) {
    const searchParams = await props.searchParams;

    const users = await UserService.getMultiple({
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            emailVerificationDeadline: true,
            image: true,
            role: true,
            usedStorage: true,
            maxStorage: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    folders: true,
                    files: true,
                },
            },
        },
    });

    return (
        <div>
            <UsersDataTable
                users={users}
                defaultUserIndex={searchParams.u ? users.findIndex(u => u.id === searchParams.u) : -1}
            />
        </div>
    );
}
