import {Button} from "@/components/ui/button";
import {Settings2} from "lucide-react";
import {useFormatter, useTranslations} from "next-intl";
import {UploadImagesDialog} from "@/components/images/UploadImagesDialog";
import {ImagePreview} from "@/components/images/ImagePreview";

export const FolderContent = ({folder, locale}: { folder: any, locale: string }) => {

    const t = useTranslations("folders");
    const format = useFormatter();

    return (
        <main className="flex flex-col p-6">
            <div className={"flex gap-4 mb-10"}>
                <UploadImagesDialog folderId={folder.id}/>
                <Button variant="outline">
                    <Settings2 className={"mr-2"}/> {t('actions.manage')}
                </Button>
            </div>

            <h2 className={"font-semibold mb-5"}>{folder.name}</h2>

            <div className={"flex flex-wrap gap-6"}>
                {folder.images.map((image: any) => (
                    <ImagePreview key={image.id} image={image} />
                ))}
            </div>
        </main>
    )
}
