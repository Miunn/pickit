import {FolderX} from "lucide-react";
import FolderPreview from "@/components/folders/FolderPreview";
import {useTranslations} from "next-intl";
import { FolderWithAccessToken, FolderWithCover, FolderWithImagesCount, FolderWithLocked } from "@/lib/definitions";

export default function FoldersContent({ folders, locale }: { folders: (FolderWithAccessToken & FolderWithImagesCount & FolderWithCover & FolderWithLocked)[], locale: string }) {

    const t = useTranslations("folders");

    return (
        <main className="flex flex-col flex-grow">
            <h3 className={"font-semibold mb-5"}>{t('page.subtitle')}</h3>

            <div className={`flex flex-wrap gap-6 ${folders.length == 0 && "justify-center"} mb-10`}>
                {folders.length == 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <FolderX className={"w-32 h-32 opacity-20"}/>
                        <p>{t('empty')}</p>
                    </div>
                    : folders.map(folder => (
                        <FolderPreview key={folder.id} folder={folder} locale={locale}/>
                    ))
                }
            </div>
        </main>
    )
}
