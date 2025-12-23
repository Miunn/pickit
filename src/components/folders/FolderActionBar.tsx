import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, LayoutGrid, List, ArrowUp, ArrowDown, Tag } from "lucide-react";
import { UploadImagesDialog } from "../files/upload/UploadImagesDialog";
import EditDescriptionDialog from "./dialogs/EditDescriptionDialog";
import { ShareFolderDialog } from "./dialogs/ShareFolderDialog";
import SortImages from "./SortImages";
import ViewSelector, { ViewState } from "./ViewSelector";
import { useFolderContext } from "@/context/FolderContext";
import { useState } from "react";
import { useFilesContext } from "@/context/FilesContext";
import { useTranslations } from "next-intl";
import { useSession } from "@/providers/SessionProvider";
import { Link } from "@/i18n/navigation";
import { FolderTokenPermission } from "@prisma/client";
import { ImagesSortMethod } from "@/types/imagesSort";
import { useTopLoader } from "nextjs-toploader";
import { toast } from "@/hooks/use-toast";

export default function FolderActionBar() {
    const { isGuest } = useSession();
    const { done } = useTopLoader();
    const { folder, token, tokenHash, isShared } = useFolderContext();
    const { viewState, sortState, setViewState, setSortState, files, setFiles } = useFilesContext();
    const t = useTranslations("folders");

    const [openUpload, setOpenUpload] = useState(false);
    const [openShare, setOpenShare] = useState(false);
    const [openEditDescription, setOpenEditDescription] = useState(false);

    return (
        <>
            <div className="hidden lg:flex gap-4">
                <ViewSelector viewState={viewState} setViewState={setViewState} />
                {viewState === ViewState.Grid ? <SortImages sortState={sortState} setSortState={setSortState} /> : null}
                {!!!isGuest || token?.permission === FolderTokenPermission.WRITE ? (
                    <UploadImagesDialog
                        folderId={folder.id}
                        shouldDisplayNotify={!!!isGuest && !isShared}
                        onUpload={uploadedFiles => {
                            setFiles([...files, ...uploadedFiles]);
                        }}
                    />
                ) : null}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size={"icon"}>
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {!folder.description ? (
                            <DropdownMenuItem onClick={() => setOpenEditDescription(true)}>
                                {t("addDescription")}
                            </DropdownMenuItem>
                        ) : null}
                        {!!!isGuest || (token?.token && token.allowMap) ? (
                            <DropdownMenuItem asChild>
                                <Link href={`/app/map${token?.token ? `?share=${token?.token}&h=${tokenHash}` : ""}`}>
                                    {t("actions.map")}
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                        {!!!isGuest ? (
                            <DropdownMenuItem onClick={() => setOpenShare(true)}>{t("share.label")}</DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                            onClick={() => {
                                toast({
                                    title: t("downloadStarted"),
                                    description: t("downloadStartedDescription", { name: folder.name }),
                                });
                                setTimeout(() => {
                                    done();
                                }, 1000);
                            }}
                            asChild
                        >
                            <a href={`/api/folders/${folder.id}/download`} download>
                                {t("download.label")}
                            </a>
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
                        <DropdownMenuSubTrigger>{t("views.label")}</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem
                                    onClick={() => setViewState(ViewState.Grid)}
                                    className="flex items-center gap-3"
                                >
                                    <LayoutGrid className="w-4 h-4" /> {t("views.options.grid")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setViewState(ViewState.List)}
                                    className="flex items-center gap-3"
                                >
                                    <List className="w-4 h-4" /> {t("views.options.list")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setViewState(ViewState.TagGrouped)}
                                    className="flex items-center gap-3"
                                >
                                    <Tag className="w-4 h-4" /> {t("views.options.tagGrouped")}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    {viewState === ViewState.Grid ? (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>{t("sort.label")}</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem
                                    onClick={event => {
                                        event.preventDefault();
                                        if (sortState === ImagesSortMethod.NameDesc) {
                                            setSortState(ImagesSortMethod.NameAsc);
                                        } else {
                                            setSortState(ImagesSortMethod.NameDesc);
                                        }
                                    }}
                                    className="flex justify-between items-center gap-3"
                                >
                                    {t("sort.options.name")}
                                    {sortState === ImagesSortMethod.NameAsc ? <ArrowUp className="w-4 h-4" /> : null}
                                    {sortState === ImagesSortMethod.NameDesc ? <ArrowDown className="w-4 h-4" /> : null}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={event => {
                                        event.preventDefault();
                                        if (sortState === ImagesSortMethod.SizeDesc) {
                                            setSortState(ImagesSortMethod.SizeAsc);
                                        } else {
                                            setSortState(ImagesSortMethod.SizeDesc);
                                        }
                                    }}
                                    className="flex justify-between items-center gap-3"
                                >
                                    {t("sort.options.size")}
                                    {sortState === ImagesSortMethod.SizeAsc ? <ArrowUp className="w-4 h-4" /> : null}
                                    {sortState === ImagesSortMethod.SizeDesc ? <ArrowDown className="w-4 h-4" /> : null}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={event => {
                                        event.preventDefault();
                                        if (sortState === ImagesSortMethod.DateDesc) {
                                            setSortState(ImagesSortMethod.DateAsc);
                                        } else {
                                            setSortState(ImagesSortMethod.DateDesc);
                                        }
                                    }}
                                    className="flex justify-between items-center gap-3"
                                >
                                    {t("sort.options.date")}
                                    {sortState === ImagesSortMethod.DateAsc ? <ArrowUp className="w-4 h-4" /> : null}
                                    {sortState === ImagesSortMethod.DateDesc ? <ArrowDown className="w-4 h-4" /> : null}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    ) : null}
                    {!!!isGuest || (token?.token && token.allowMap) ? (
                        <DropdownMenuItem asChild>
                            <Link href={`/app/map${token?.token ? `?share=${token?.token}&h=${tokenHash}` : ""}`}>
                                {t("actions.map")}
                            </Link>
                        </DropdownMenuItem>
                    ) : null}
                    {!!!isGuest ? (
                        <DropdownMenuItem onClick={() => setOpenUpload(true)}>{t("upload.label")}</DropdownMenuItem>
                    ) : null}
                    {!!!isGuest ? (
                        <DropdownMenuItem onClick={() => setOpenShare(true)}>{t("share.label")}</DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem asChild>
                        <a href={`/api/folders/${folder.id}/download`} download>
                            {t("download.label")}
                        </a>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <EditDescriptionDialog open={openEditDescription} setOpen={setOpenEditDescription} folder={folder} />
            <UploadImagesDialog
                open={openUpload}
                setOpen={setOpenUpload}
                shouldDisplayNotify={isShared}
                folderId={folder.id}
                onUpload={uploadedFiles => {
                    setFiles([...files, ...uploadedFiles]);
                }}
            />
            <ShareFolderDialog open={openShare} setOpen={setOpenShare} folder={folder} />
        </>
    );
}
