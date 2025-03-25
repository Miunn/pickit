'use client'

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadImagesDialog } from "@/components/images/UploadImagesDialog";
import { ImagesGrid } from "@/components/images/ImagesGrid";
import { ShareFolderDialog } from "@/components/folders/ShareFolderDialog";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImagesWithFolderAndComments } from "@/lib/definitions";
import SortImages, { ImagesSortMethod } from "./SortImages";
import { useQueryState } from 'nuqs'
import { downloadClientFolder, getSortedFolderContent } from "@/lib/utils";
import ViewSelector, { ViewState } from "./ViewSelector";
import ImagesList from "../images/ImagesList";

export interface FolderContentProps {
    folder: FolderWithCreatedBy & FolderWithImagesWithFolderAndComments & FolderWithAccessToken;
    defaultView?: ViewState;
    isGuest?: boolean;
}

export const FolderContent = ({ folder, defaultView, isGuest }: FolderContentProps) => {
    const t = useTranslations("folders");
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
    const [sortState, setSortState] = useQueryState<ImagesSortMethod>('sort', {
        defaultValue: ImagesSortMethod.DateDesc,
        parse: (v) => {
            switch (v) {
                case "name-asc":
                    return ImagesSortMethod.NameAsc;
                case "name-desc":
                    return ImagesSortMethod.NameDesc;
                case "size-asc":
                    return ImagesSortMethod.SizeAsc;
                case "size-desc":
                    return ImagesSortMethod.SizeDesc;
                case "date-asc":
                    return ImagesSortMethod.DateAsc;
                case "date-desc":
                    return ImagesSortMethod.DateDesc;
                default:
                    return ImagesSortMethod.DateDesc;
            }
        }
    });

    const downloadT = useTranslations("folders.download");

    return (
        <div>
            <h3 className={"mb-2 flex justify-between items-center"}>
                <p className="font-semibold">{folder.name} {
                    isGuest
                        ? <span className="font-normal text-sm">- Shared by {folder.createdBy.name}</span>
                        : null
                }</p>

                <div className={"flex gap-4"}>
                    <ViewSelector viewState={viewState} setViewState={setViewState} />
                    {viewState === ViewState.Grid
                        ? <SortImages sortState={sortState} setSortState={setSortState} />
                        : null
                    }
                    {!!!isGuest
                        ? <UploadImagesDialog folderId={folder.id} />
                        : null}
                    {!!!isGuest ? <ShareFolderDialog folder={folder} /> : null}
                    <Button variant="outline" onClick={() => downloadClientFolder(folder, downloadT)}>
                        <Download className={"mr-2"} /> {t('actions.download')}
                    </Button>
                </div>
            </h3>

            <div className="flex-1 overflow-auto">
                {viewState === ViewState.List
                    ? <ImagesList folder={folder} />
                    : <ImagesGrid folder={folder} sortState={sortState} />
                }
            </div>
        </div>
    )
}