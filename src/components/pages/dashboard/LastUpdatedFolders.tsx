import FolderPreviewGrid from "@/components/folders/views/grid/FolderPreviewGrid";
import {
    FolderWithAccessToken,
    FolderWithFilesCount,
    FolderWithCover,
    FolderWithTags,
    FileWithTags,
    FileWithComments,
} from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { FolderX } from "lucide-react";
import { useTranslations } from "next-intl";

interface LastUpdatedFoldersProps {
    readonly folders: (FolderWithAccessToken &
        FolderWithFilesCount &
        FolderWithCover & { files: ({ folder: FolderWithTags } & FileWithTags & FileWithComments)[] })[];
}

export default function LastUpdatedFolders({ folders }: LastUpdatedFoldersProps) {
    const t = useTranslations("pages.dashboard");

    return (
        <div
            className={cn(
                "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] gap-3 mb-10",
                folders.length === 0 && "justify-center"
            )}
        >
            {folders.length === 0 ? (
                <div className={"col-span-full flex flex-col justify-center items-center"}>
                    <FolderX className={"w-32 h-32 opacity-20"} />
                    <p>{t("folders.empty")}</p>
                </div>
            ) : (
                folders.map(folder => <FolderPreviewGrid key={folder.id} folder={folder} />)
            )}
        </div>
    );
}
