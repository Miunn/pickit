import {prisma} from "@/lib/prisma";
import FoldersContent from "@/components/folders/FoldersContent";
import { getCurrentSession } from "@/lib/authUtils";
import { redirect } from "@/i18n/routing";
import { FolderX } from "lucide-react";
import FolderPreview from "@/components/folders/FolderPreview";
import { getTranslations } from "next-intl/server";

export default async function FoldersPage({ params }: { params: { locale: string } }) {

    const { user } = await getCurrentSession();
    const t = await getTranslations("pages.folders");

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
        <main className="flex flex-col flex-grow">
            <h3 className={"font-semibold mb-5"}>{t('headline')}</h3>

            <div className={`flex flex-wrap gap-6 ${folders.length == 0 && "justify-center"} mb-10`}>
                {folders.length == 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <FolderX className={"w-32 h-32 opacity-20"}/>
                        <p>{t('empty')}</p>
                    </div>
                    : folders.map(folder => (
                        <FolderPreview key={folder.id} folder={folder} locale={params.locale}/>
                    ))
                }
            </div>
        </main>
    )
}
