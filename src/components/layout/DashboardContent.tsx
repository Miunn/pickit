import CreateFolderDialog from "@/components/folders/CreateFolderDialog";
import {Button} from "@/components/ui/button";
import {FolderX, ImageOff, ImageUp, Settings2} from "lucide-react";
import FolderPreview from "@/components/folders/FolderPreview";
import {useTranslations} from "next-intl";
import {ImagePreview} from "@/components/images/ImagePreview";

export default function DashboardContent({lastFolders, lastImages, locale}) {

    const t = useTranslations("dashboard");

    return (
        <div className="flex flex-col flex-grow p-6">
            <div className={"flex gap-4 mb-10"}>
                <CreateFolderDialog/>
                <Button variant="outline">
                    <ImageUp className={"mr-2"}/> {'uploadImages'}
                </Button>
                <Button variant="outline">
                    <Settings2 className={"mr-2"}/> {'manageLinks'}
                </Button>
            </div>

            <h2 className={"font-semibold mb-5"}>{t('folders.lastUpdatedFolders')}</h2>

            <div className={`flex flex-wrap gap-6 ${lastFolders.length == 0 && "justify-center"} mb-10`}>
                {lastFolders.length == 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <FolderX className={"w-32 h-32 opacity-20"}/>
                        <p>{t('folders.empty')}</p>
                    </div>
                    : lastFolders.map(folder => (
                        <FolderPreview key={folder.id} folder={folder} locale={locale}/>
                    ))
                }
            </div>

            <h2 className={"font-semibold mb-5"}>{t('images.lastUploadedImages')}</h2>

            <div className={`flex flex-wrap gap-6 ${lastImages.length == 0 && "justify-center"}`}>
                {lastImages.length == 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <ImageOff className={"w-32 h-32 opacity-20"}/>
                        <p>{t('images.empty')}</p>
                    </div>
                    : lastImages.map(image => (
                        <ImagePreview key={image.id} image={image} locale={locale} withFolder={true} />
                    ))
                }
            </div>
        </div>
    )
}
