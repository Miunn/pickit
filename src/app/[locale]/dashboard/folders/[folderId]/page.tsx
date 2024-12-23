import { prisma } from "@/lib/prisma";
import { FolderContent } from "@/components/folders/FolderContent";

export default async function FolderPage({ params }: { params: { folderId: string, locale: string } }) {

    const folder = await prisma.folder.findUnique({
        where: {
            id: params.folderId
        },
        include: {
            images: true,
            AccessToken: true
        },
    });

    return (
        <>
            {folder
                ? (<FolderContent folder={folder} locale={params.locale} />)
                : null
            }
        </>
    )
}
