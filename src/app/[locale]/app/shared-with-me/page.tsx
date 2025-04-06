import { redirect } from "@/i18n/navigation";
import { getCurrentSession } from "@/lib/session";

export default async function SharedWithMePage({ params }: { params: { locale: string } }) {

    const { user } = await getCurrentSession();
    if (!user) {
        return redirect({ href: `/signin`, locale: params.locale });
    }

    return (
        <p>Shared With Me</p>
    )
}