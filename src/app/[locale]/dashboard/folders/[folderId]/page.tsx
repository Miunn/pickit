import {Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {FolderContent} from "@/components/folders/FolderContent";
import fs from "fs";

export default async function FolderPage({ params }: { params: { folderId: string, locale: string } }) {

    const folder: Prisma.PromiseReturnType<Prisma.FolderCreateInput> = await prisma.folder.findUnique({
        where: {
            id: params.folderId
        },
        include: {
            images: true,
        },
    });

    return (
        <FolderContent folder={folder} locale={params.locale} />
    )
}
