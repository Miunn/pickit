import CreateFolderDialog from "@/components/folders/CreateFolderDialog";
import {Button} from "@/components/ui/button";
import {FolderX, ImageUp, Settings2} from "lucide-react";
import FolderPreview from "@/components/folders/FolderPreview";
import {useTranslations} from "next-intl";
import React from "react";
import {LastUploadedImages} from "@/components/images/LastUploadedImages";
import { Folder, Image } from "@prisma/client";
import { FolderWithAccessToken, FolderWithCover, FolderWithImagesCount } from "@/lib/definitions";

export default function DashboardContent({lastFolders, lastImages, locale}: { lastFolders: (FolderWithAccessToken & FolderWithImagesCount & FolderWithCover)[], lastImages: Image[], locale: string }) {

    const t = useTranslations("dashboard");

    return (
        <div className="flex flex-col flex-grow">
            <div className={"flex gap-4 mb-10"}>
                <Button variant="outline">
                    <ImageUp className={"mr-2"}/> {'uploadImages'}
                </Button>
                <Button variant="outline">
                    <Settings2 className={"mr-2"}/> {'manageLinks'}
                </Button>
            </div>

            <h2 className={"font-semibold mb-5"}>{t('folders.lastUpdatedFolders')}</h2>

            <div className={`flex flex-wrap gap-3 ${lastFolders.length == 0 && "justify-center"} mb-10`}>
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

            <LastUploadedImages images={lastImages} locale={locale} />
        </div>
    )
}
