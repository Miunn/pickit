import {prisma} from "@/lib/prisma";
import FoldersContent from "@/components/folders/FoldersContent";
import { getCurrentSession } from "@/lib/authUtils";
import { redirect } from "@/i18n/routing";

export default async function FoldersPage({ params }: { params: { locale: string } }) {

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect("/signin");
    }

    const folders = await prisma.folder.findMany({
        where: {
            createdBy: { id: user.id }
        },
        include: {
            cover: true,
            AccessToken: true,
            _count: {
                select: { images: true }
            }
        },
    });

    return (
        <FoldersContent folders={folders} locale={params.locale} />
    )
}
