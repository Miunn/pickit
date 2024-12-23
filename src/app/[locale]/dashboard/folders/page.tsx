import {prisma} from "@/lib/prisma";
import FoldersContent from "@/components/folders/FoldersContent";

export default async function FoldersPage({ params }: { params: { locale: string } }) {

    const folders = await prisma.folder.findMany({
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
