import {prisma} from "@/lib/prisma";
import FoldersContent from "@/components/folders/FoldersContent";

export default async function FoldersPage({ params }: { params: { locale: string } }) {

    const folders = await prisma.folder.findMany();

    return (
        <FoldersContent folders={folders} locale={params.locale} />
    )
}
