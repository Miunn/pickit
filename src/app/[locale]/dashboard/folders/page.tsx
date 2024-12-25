import {prisma} from "@/lib/prisma";
import FoldersContent from "@/components/folders/FoldersContent";
import { auth } from "@/actions/auth";

export default async function FoldersPage({ params }: { params: { locale: string } }) {

    const session = await auth();
    const folders = await prisma.folder.findMany({
        where: {
            createdBy: {
                id: session?.user?.id
            }
        },
        include: {
            cover: true,
            AccessToken: true,
            _count: {
                select: { images: true }
            }
        }
    });

    return (
        <FoldersContent folders={folders} locale={params.locale} />
    )
}
