import { redirect } from "@/i18n/navigation";
import { getCurrentSession } from "@/lib/session";
import { Role } from "@prisma/client";

export default async function AdminLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }>,
) {
  const { locale } = await props.params;
  const { children } = props;

  const { user } = await getCurrentSession();

  if (!user?.role.includes(Role.ADMIN)) {
    return redirect({ href: `/app`, locale: locale });
  }

  return <div className={"min-h-screen"}>{children}</div>;
}
