import { getUser } from "@/actions/userAdministration";
import AccountForm from "@/components/account/accountForm";
import BreadcrumbPortal from "@/components/layout/BreadcrumbPortal";
import HeaderBreadcumb from "@/components/layout/HeaderBreadcumb";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminUser({ params }: { params: { locale: string, userId: string } }) {
    
    const user = await prisma.user.findUnique({
        where: { id: params.userId },
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

    if (!user) {
        return redirect({ href: "/administration/users", locale: params.locale });
    }

    return (
        <div>
            <BreadcrumbPortal>
                <HeaderBreadcumb adminUser={user} />
            </BreadcrumbPortal>
            <AccountForm user={user} />
        </div>
    );
}