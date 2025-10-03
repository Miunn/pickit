"use client";

import { useQueryState } from "nuqs";
import ViewSelector, { ViewState } from "./ViewSelector";
import {
    FileWithComments,
    FileWithTags,
    FolderWithAccessToken,
    FolderWithCover,
    FolderWithCreatedBy,
    FolderWithFilesCount,
    FolderWithTags,
} from "@/lib/definitions";
import { useTranslations } from "next-intl";
import { FolderX } from "lucide-react";
import FolderPreviewGrid from "./FolderPreviewGrid";
import FoldersList from "./views/list/FoldersList";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import CreateFolderDialog from "./CreateFolderDialog";
import { useState } from "react";

export default function FoldersContent({
    defaultView,
    folders,
}: {
    defaultView?: ViewState;
    folders: (FolderWithCreatedBy &
        FolderWithAccessToken &
        FolderWithFilesCount &
        FolderWithCover & { files: ({ folder: FolderWithTags } & FileWithTags & FileWithComments)[] })[];
}) {
    const t = useTranslations("pages.folders");
    const [viewState, setViewState] = useQueryState<ViewState>("view", {
        defaultValue: defaultView || ViewState.Grid,
        parse: v => {
            switch (v) {
                case "grid":
                    return ViewState.Grid;
                case "list":
                    return ViewState.List;
                default:
                    return ViewState.Grid;
            }
        },
    });
    const [openCreateFolder, setOpenCreateFolder] = useState(false);

    return (
        <>
            <ContextMenu modal={false}>
                <ContextMenuTrigger className="flex flex-col flex-grow">
                    <h3 className={"font-semibold mb-5 flex justify-between items-center"}>
                        {t("headline")}
                        <ViewSelector viewState={viewState} setViewState={setViewState} />
                    </h3>

                    <div>
                        {folders.length === 0 && viewState === ViewState.Grid ? (
                            <div className={"flex flex-col justify-center items-center"}>
                                <FolderX className={"w-32 h-32 opacity-20"} />
                                <p>{t("empty")}</p>
                            </div>
                        ) : null}
                        {folders.length > 0 && viewState === ViewState.Grid ? (
                            <div
                                className={`grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] gap-6 ${folders.length === 0 && "justify-center"} mb-10`}
                            >
                                {folders.map(folder => (
                                    <FolderPreviewGrid key={folder.id} folder={folder} />
                                ))}
                            </div>
                        ) : null}
                        {viewState === ViewState.List ? <FoldersList folders={folders} /> : null}
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => setOpenCreateFolder(true)}>
                        {t("contextMenu.createFolder")}
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <CreateFolderDialog open={openCreateFolder} setOpen={setOpenCreateFolder} />
        </>
    );
}
