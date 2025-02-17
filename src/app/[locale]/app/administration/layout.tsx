import Header from "@/components/layout/Header";
import { redirect } from "@/i18n/routing";
import { getCurrentSession } from "@/lib/authUtils";
import { Role } from "@prisma/client";

export default async function AdminLayout({
    children,
    params: { locale },
}: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {

    const { user } = await getCurrentSession();

    if (!user?.role.includes(Role.ADMIN)) {
        return redirect(`/app`);
    }

    return (
        <div className={"min-h-screen"}>
            {children}
        </div>
    );
}
