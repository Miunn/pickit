import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    FolderWithAccessToken,
    FolderWithFilesCount,
    FileWithComments,
    FolderWithFilesWithFolderAndComments,
} from "@/lib/definitions";
import { downloadClientFiles, formatBytes } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Images, MoreHorizontal } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import RenameFolderDialog from "@/components/folders/dialogs/RenameFolderDialog";
import DeleteFolderDialog from "@/components/folders/dialogs/DeleteFolderDialog";
import FolderPropertiesDialog from "@/components/folders/dialogs/FolderPropertiesDialogs";
import Link from "next/link";
import { ShareFolderDialog } from "@/components/folders/dialogs/ShareFolderDialog";
import ChangeCoverFolderDialog from "@/components/folders/dialogs/ChangeCoverFolderDialog";
import { getImagesWithFolderAndCommentsFromFolder } from "@/actions/files";
import { useSearchParams } from "next/navigation";
import { FolderWithTags, FileWithTags } from "@/lib/definitions";

export const foldersListViewColumns: ColumnDef<
    FolderWithAccessToken & FolderWithFilesCount & FolderWithFilesWithFolderAndComments
>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={value => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 25,
    },
    {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
            <div className="truncate font-medium flex items-center gap-2">
                {row.original.coverId ? (
                    <Image
                        src={`/api/folders/${row.original.id}/images/${row.original.coverId}`}
                        width={40}
                        height={40}
                        alt={row.getValue("name")}
                        className="w-[40px] h-[40px] object-cover rounded-xl"
                    />
                ) : (
                    <div className={"w-[40px] h-[40px] bg-gray-100 rounded-xl flex justify-center items-center"}>
                        <Images className={"opacity-50 w-[20px] h-[20px]"} />
                    </div>
                )}

                <Link href={`/app/folders/${row.original.id}`} className="hover:underline">
                    {row.getValue("name")}
                </Link>
            </div>
        ),
        sortUndefined: "last",
        sortDescFirst: false,
    },
    {
        accessorKey: "size",
        header: () => {
            const t = useTranslations("folders.views.list.header");
            return <p>{t("size")}</p>;
        },
        cell: ({ row }) => <p>{formatBytes(row.original.size)}</p>,
    },
    {
        accessorKey: "createdAt",
        header: () => {
            const t = useTranslations("folders.views.list.header");
            return <p>{t("createdAt")}</p>;
        },
        cell: ({ row }) => {
            const formatter = useFormatter();

            return (
                <p className="capitalize">
                    {formatter.dateTime(row.original.createdAt, {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    })}
                </p>
            );
        },
    },
    {
        accessorKey: "updatedAt",
        header: () => {
            const t = useTranslations("folders.views.list.header");
            return <p>{t("updatedAt")}</p>;
        },
        cell: ({ row }) => {
            const formatter = useFormatter();

            return (
                <p className="capitalize">
                    {formatter.dateTime(row.original.createdAt, {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    })}
                </p>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const t = useTranslations("folders.views.list.columns.actions");
            const downloadT = useTranslations("components.download");
            const searchParams = useSearchParams();
            const [folderImages, setFolderImages] = useState<
                ({ folder: FolderWithTags } & FileWithTags & FileWithComments)[]
            >([]);

            const loadImages = useCallback(async () => {
                setFolderImages(
                    (await getImagesWithFolderAndCommentsFromFolder(row.original.id)).images as ({
                        folder: FolderWithTags;
                    } & FileWithTags &
                        FileWithComments)[]
                );
            }, [row.original.id]);

            useEffect(() => {
                loadImages();
            }, [row.original.id, loadImages]);

            const [openShare, setOpenShare] = useState<boolean>(false);
            const [openChangeCover, setOpenChangeCover] = useState<boolean>(false);
            const [openRename, setOpenRename] = useState<boolean>(false);
            const [openProperties, setOpenProperties] = useState<boolean>(false);
            const [openDelete, setOpenDelete] = useState<boolean>(false);

            return (
                <>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                            <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/app/folders/${row.original.id}`}>{t("open")}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => row.toggleSelected(!row.getIsSelected())}>
                                {row.getIsSelected() ? t("deselect") : t("select")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    downloadClientFiles(
                                        downloadT,
                                        row.original.files,
                                        row.original.name,
                                        searchParams.get("share"),
                                        searchParams.get("h")
                                    )
                                }
                            >
                                {t("download")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOpenShare(true)}>{t("share")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOpenChangeCover(true)}>
                                {t("changeCover")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOpenRename(true)}>{t("rename")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOpenProperties(true)}>
                                {t("properties")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setOpenDelete(true)}
                                className="text-destructive focus:text-destructive font-semibold"
                            >
                                {t("delete")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <ShareFolderDialog folder={row.original} open={openShare} setOpen={setOpenShare} />
                    <ChangeCoverFolderDialog
                        folderId={row.original.id}
                        images={folderImages}
                        open={openChangeCover}
                        setOpen={setOpenChangeCover}
                    />
                    <RenameFolderDialog
                        folderId={row.original.id}
                        folderName={row.original.name}
                        openState={openRename}
                        setOpenState={setOpenRename}
                    />
                    <DeleteFolderDialog
                        folderId={row.original.id}
                        folderName={row.original.name}
                        openState={openDelete}
                        setOpenState={setOpenDelete}
                    />
                    <FolderPropertiesDialog folder={row.original} open={openProperties} setOpen={setOpenProperties} />
                </>
            );
        },
        size: 50,
    },
];
