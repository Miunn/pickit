import { redirect } from "@/i18n/routing";
import { getCurrentSession } from "@/lib/session";

export default async function SharedWithMePage() {

    const { user } = await getCurrentSession();
    if (!user) {
        return redirect(`/signin`);
    }

    return (
        <p>Shared With Me</p>
    )
}