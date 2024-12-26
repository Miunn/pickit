import { prisma } from "@/lib/prisma";
import { FolderContent } from "@/components/folders/FolderContent";
import { auth } from "@/actions/auth";

export default async function FolderPage({ params }: { params: { folderId: string, locale: string } }) {

    const session = await auth();
    const folder = await prisma.folder.findUnique({
        where: {
            id: params.folderId,
            createdBy: {
                id: session?.user?.id
            }
        },
        include: {
            images: {
                include: {
                    folder: true
                }
            },
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
