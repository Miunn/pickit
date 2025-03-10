'use client'

import { useQueryState } from "nuqs";
import ViewSelector, { ViewState } from "./ViewSelector"
import { FolderWithAccessToken, FolderWithCover, FolderWithImagesCount } from "@/lib/definitions";
import { useTranslations } from "next-intl";
import { FolderX } from "lucide-react";
import FolderPreviewGrid from "./FolderPreviewGrid";
import { folder } from "jszip";
import FoldersList from "./views/list/FoldersList";

export default function FoldersContent({ defaultView, folders }: { defaultView?: ViewState, folders: (FolderWithAccessToken & FolderWithImagesCount & FolderWithCover)[] }) {
    const t = useTranslations("pages.folders");
    const [viewState, setViewState] = useQueryState<ViewState>('view', {
        defaultValue: defaultView || ViewState.Grid,
        parse: (v) => {
            switch (v) {
                case "grid":
                    return ViewState.Grid;
                case "list":
                    return ViewState.List;
                default:
                    return ViewState.Grid;
            }
        }
    });

    return (
        <>
            <h3 className={"font-semibold mb-5 flex justify-between items-center"}>
                {t('headline')}
                <ViewSelector viewState={viewState} setViewState={setViewState} />
            </h3>

            <div>
                {folders.length == 0 && viewState == ViewState.Grid
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <FolderX className={"w-32 h-32 opacity-20"} />
                        <p>{t('empty')}</p>
                    </div>
                    : null
                }
                {folders.length > 0 && viewState == ViewState.Grid
                    ? <div className={`flex flex-wrap gap-6 ${folders.length == 0 && "justify-center"} mb-10`}>
                        {folders.map(folder => (
                            <FolderPreviewGrid key={folder.id} folder={folder} />
                        ))}
                    </div>
                    : null
                }
                {viewState == ViewState.List
                    ? <FoldersList folders={folders} />
                    : null
                }
            </div>
        </>
    )
}