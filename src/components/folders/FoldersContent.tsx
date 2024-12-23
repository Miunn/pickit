import CreateFolderDialog from "@/components/folders/CreateFolderDialog";
import {Button} from "@/components/ui/button";
import {FolderX, ImageUp, Settings2} from "lucide-react";
import FolderPreview from "@/components/folders/FolderPreview";
import {useTranslations} from "next-intl";
import { Folder } from "@prisma/client";

export default function FoldersContent({ folders, locale }: { folders: Folder[], locale: string }) {

    const t = useTranslations("folders");

    return (
        <main className="flex flex-col flex-grow">
            <div className={"flex gap-4 mb-10"}>
                <CreateFolderDialog/>
                <Button variant="outline">
                    <ImageUp className={"mr-2"}/> {t('actions.upload')}
                </Button>
                <Button variant="outline">
                    <Settings2 className={"mr-2"}/> {t('actions.manage')}
                </Button>
            </div>

            <h2 className={"font-semibold mb-5"}>{t('page.subtitle')}</h2>

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
