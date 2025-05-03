'use client'

import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Download, LayoutGrid, List, MoreHorizontal, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadImagesDialog } from "@/components/images/UploadImagesDialog";
import { ImagesGrid } from "@/components/images/ImagesGrid";
import { ShareFolderDialog } from "@/components/folders/ShareFolderDialog";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithFilesWithFolderAndComments } from "@/lib/definitions";
import SortImages, { ImagesSortMethod } from "./SortImages";
import { useQueryState } from 'nuqs'
import { downloadClientFolder } from "@/lib/utils";
import ViewSelector, { ViewState } from "./ViewSelector";
import ImagesList from "../images/ImagesList";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useEffect, useState } from "react";
import EditDescriptionDialog from "./EditDescriptionDialog";
import { useSearchParams } from "next/navigation";
import { useSidebar } from "../ui/sidebar";
import { useFolderContext } from "@/context/FolderContext";

export interface FolderContentProps {
    defaultView?: ViewState;
    isGuest?: boolean;
}

export const FolderContent = ({ defaultView, isGuest }: FolderContentProps) => {
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const tokenType = searchParams.get("t");
    const hashPinCode = searchParams.get("h");

    const { folder } = useFolderContext();

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
        defaultValue: ImagesSortMethod.PositionAsc,
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
                case "position-asc":
                    return ImagesSortMethod.PositionAsc;
                case "position-desc":
                    return ImagesSortMethod.PositionDesc;
                default:
                    return ImagesSortMethod.PositionAsc;
            }
        }
    });

    const [openUpload, setOpenUpload] = useState(false);
    const [openShare, setOpenShare] = useState(false);
    const [openEditDescription, setOpenEditDescription] = useState(false);

    const downloadT = useTranslations("folders.download");

    return (
        <div>
            <h3 className={"mb-2 flex justify-between items-center"}>
                <p className="font-semibold">{folder.name} {
                    isGuest
                        ? <span className="font-normal text-sm">- {t('sharedBy', { name: folder.createdBy.name })}</span>
                        : null
                }</p>

                <div className={"hidden xl:flex gap-4"}>
                    {!folder.description
                        ? <Button variant="outline" onClick={() => setOpenEditDescription(true)}><Pencil className={"size-4 mr-2"} /> {t('addDescription')}</Button>
                        : null
                    }
                    <ViewSelector viewState={viewState} setViewState={setViewState} />
                    {viewState === ViewState.Grid
                        ? <SortImages sortState={sortState} setSortState={setSortState} />
                        : null
                    }
                    {!!!isGuest
                        ? <UploadImagesDialog folderId={folder.id} />
                        : null}
                    {!!!isGuest ? <ShareFolderDialog folder={folder} /> : null}
                    <Button variant="outline" onClick={() => downloadClientFolder(folder, downloadT, shareToken, tokenType === "accessToken" ? "accessToken" : tokenType === "personAccessToken" ? "personAccessToken" : null, hashPinCode)}>
                        <Download className={"mr-2"} /> {t('actions.download')}
                    </Button>
                </div>
                <div className="hidden lg:flex xl:hidden gap-4">
                    <ViewSelector viewState={viewState} setViewState={setViewState} />
                    {viewState === ViewState.Grid
                        ? <SortImages sortState={sortState} setSortState={setSortState} />
                        : null
                    }
                    {!!!isGuest
                        ? <UploadImagesDialog folderId={folder.id} />
                        : null}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size={"icon"}>
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {!folder.description
                                ? <DropdownMenuItem onClick={() => setOpenEditDescription(true)}>{t('addDescription')}</DropdownMenuItem>
                                : null
                            }
                            {!!!isGuest
                                ? <DropdownMenuItem onClick={() => setOpenShare(true)}>
                                    {t('share.label')}
                                </DropdownMenuItem>
                                : null}
                            <DropdownMenuItem onClick={() => downloadClientFolder(folder, downloadT)}>
                                {t('download.label')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="lg:hidden">
                        <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>{t('views.label')}</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => setViewState(ViewState.Grid)} className="flex items-center gap-3">
                                        <LayoutGrid className="w-4 h-4" /> {t('views.options.grid')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setViewState(ViewState.List)} className="flex items-center gap-3">
                                        <List className="w-4 h-4" /> {t('views.options.list')}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        {viewState === ViewState.Grid
                            ? <DropdownMenuSub>
                                <DropdownMenuSubTrigger>{t('sort.label')}</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={(event) => {
                                        event.preventDefault();
                                        if (sortState === ImagesSortMethod.NameDesc) {
                                            setSortState(ImagesSortMethod.NameAsc);
                                        } else {
                                            setSortState(ImagesSortMethod.NameDesc)
                                        }
                                    }} className="flex justify-between items-center gap-3">
                                        {t('sort.options.name')}
                                        {sortState === ImagesSortMethod.NameAsc
                                            ? <ArrowUp className="w-4 h-4" />
                                            : null
                                        }
                                        {sortState === ImagesSortMethod.NameDesc
                                            ? <ArrowDown className="w-4 h-4" />
                                            : null
                                        }
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(event) => {
                                        event.preventDefault();
                                        if (sortState === ImagesSortMethod.SizeDesc) {
                                            setSortState(ImagesSortMethod.SizeAsc);
                                        } else {
                                            setSortState(ImagesSortMethod.SizeDesc)
                                        }
                                    }} className="flex justify-between items-center gap-3">
                                        {t('sort.options.size')}
                                        {sortState === ImagesSortMethod.SizeAsc
                                            ? <ArrowUp className="w-4 h-4" />
                                            : null
                                        }
                                        {sortState === ImagesSortMethod.SizeDesc
                                            ? <ArrowDown className="w-4 h-4" />
                                            : null
                                        }
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(event) => {
                                        event.preventDefault();
                                        if (sortState === ImagesSortMethod.DateDesc) {
                                            setSortState(ImagesSortMethod.DateAsc);
                                        } else {
                                            setSortState(ImagesSortMethod.DateDesc)
                                        }
                                    }} className="flex justify-between items-center gap-3">
                                        {t('sort.options.date')}
                                        {sortState === ImagesSortMethod.DateAsc
                                            ? <ArrowUp className="w-4 h-4" />
                                            : null
                                        }
                                        {sortState === ImagesSortMethod.DateDesc
                                            ? <ArrowDown className="w-4 h-4" />
                                            : null
                                        }
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            : null
                        }
                        {!!!isGuest
                            ? <DropdownMenuItem onClick={() => setOpenUpload(true)}>
                                {t('upload.label')}
                            </DropdownMenuItem>
                            : null}
                        {!!!isGuest
                            ? <DropdownMenuItem onClick={() => setOpenShare(true)}>
                                {t('share.label')}
                            </DropdownMenuItem>
                            : null}
                        <DropdownMenuItem onClick={() => downloadClientFolder(folder, downloadT)}>
                            {t('download.label')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <EditDescriptionDialog open={openEditDescription} setOpen={setOpenEditDescription} folder={folder} />
                <UploadImagesDialog open={openUpload} setOpen={setOpenUpload} folderId={folder.id} />
                <ShareFolderDialog open={openShare} setOpen={setOpenShare} folder={folder} />
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