import UsersDataTable from "@/components/admin/table/users-data-table";
import { prisma } from "@/lib/prisma";

export default async function AdminHome({ searchParams }: { searchParams: { u?: string } }) {
    
    const users = await prisma.user.findMany({
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
                    files: true
                }
            }
        }
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