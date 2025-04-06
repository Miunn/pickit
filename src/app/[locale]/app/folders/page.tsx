import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import { ViewState } from "@/components/folders/ViewSelector";
import FoldersContent from "@/components/folders/FoldersContent";

export default async function FoldersPage({ params, searchParams }: { params: { locale: string }, searchParams: { view?: ViewState } }) {

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect({ href: "/signin", locale: params.locale });
    }

    const folders = await prisma.folder.findMany({
        where: {
            createdBy: { id: user.id }
        },
        include: {
            cover: true,
            AccessToken: true,
            _count: {
                select: { images: true, videos: true }
            }
        },
    });

    return (
        <main className="flex flex-col flex-grow">
            <FoldersContent folders={folders} defaultView={searchParams.view} />
        </main>
    )
}