import {AccessToken, Folder, Image, Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {FolderContent} from "@/components/folders/FolderContent";

type FolderWithImagesAndTokens = Prisma.FolderGetPayload<{
    include: {
        images: true;
        AccessToken: true;
    }
}>

export default async function FolderPage({ params }: { params: { folderId: string, locale: string } }) {

    const folder: FolderWithImagesAndTokens = await prisma.folder.findUnique({
        where: {
            id: params.folderId
        },
        include: {
            images: {
                include: {
                    folder: {
                        select: {
                            id: true
                        }
                    }
                }
            },
            AccessToken: true
        },
    }) as FolderWithImagesAndTokens;

    return (
        <FolderContent folder={folder} locale={params.locale} />
    )
}
