import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { FileWithComments, FileWithFolder } from "@/lib/definitions";
import { formatBytes } from "@/lib/utils";
import { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import RenameImageDialog from "../../dialogs/RenameImageDialog";
import { DeleteImageDialog } from "../../dialogs/DeleteImageDialog";
import ImagePropertiesDialog from "../../dialogs/ImagePropertiesDialog";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { changeFolderCover } from "@/actions/folders";
import LoadingImage from "@/components/files/LoadingImage";
import { FileType } from "@prisma/client";
import { createTranslator } from "next-intl";

// Memoized dropdown menu component
const ImageActionsDropdown = React.memo(
    ({
        row,
        t,
        setCarouselOpen,
        setStartIndex,
        setOpenRename,
        setOpenProperties,
        setOpenDelete,
    }: {
        readonly row: Row<FileWithFolder & FileWithComments>;
        readonly t?: ReturnType<typeof createTranslator>;
        readonly setCarouselOpen?: (open: boolean) => void;
        readonly setStartIndex?: (index: number) => void;
        readonly setOpenRename: (open: boolean) => void;
        readonly setOpenProperties: (open: boolean) => void;
        readonly setOpenDelete: (open: boolean) => void;
    }) => {
        const handleSetAsCover = async () => {
            if (!row?.original?.folderId || !row?.original?.id) return;

            const r = await changeFolderCover(row.original.folderId, row.original.id);

            if (r.error) {
                toast({
                    title: t?.("columns.actions.setAsCover.error.title"),
                    description: t?.("columns.actions.setAsCover.error.description"),
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: t?.("columns.actions.setAsCover.success.title"),
                description: t?.("columns.actions.setAsCover.success.description"),
            });
        };

        const fileType = row?.original?.type === FileType.IMAGE ? "images" : "videos";

        return (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                    <DropdownMenuLabel>{t?.("columns.actions.label")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => {
                            if (setCarouselOpen && setStartIndex && row?.index !== undefined) {
                                setStartIndex(row.index);
                                setCarouselOpen(true);
                            }
                        }}
                    >
                        {t?.("columns.actions.view")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => row?.toggleSelected(!row.getIsSelected())}>
                        {row?.getIsSelected() ? t?.("columns.actions.deselect") : t?.("columns.actions.select")}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={`/api/folders/${row.original.folderId}/${fileType}/${row.original.id}/download`}
                            download
                        >
                            {t?.("columns.actions.download")}
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenRename(true)}>
                        {t?.("columns.actions.rename")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSetAsCover}>
                        {t?.("columns.actions.setAsCover.label")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenProperties(true)}>
                        {t?.("columns.actions.properties")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setOpenDelete(true)}
                        className="text-destructive focus:text-destructive font-semibold"
                    >
                        {t?.("columns.actions.delete")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
);

ImageActionsDropdown.displayName = "ImageActionsDropdown";

export const imagesListViewColumns: ColumnDef<FileWithFolder & FileWithComments>[] = [
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
        cell: ({ row, table }) => {
            if (!row?.original) return null;

            const setCarouselOpen = table.options.meta?.imagesListActions?.setCarouselOpen;
            const setStartIndex = table.options.meta?.imagesListActions?.setStartIndex;

            return (
                <div className="truncate font-medium flex items-center gap-2">
                    <div className="relative w-[40px] h-[40px]">
                        {row.original.type === FileType.VIDEO ? (
                            <LoadingImage
                                src={`/api/folders/${row.original.folder.id}/videos/${row.original.id}/thumbnail`}
                                width={40}
                                height={40}
                                alt={row.getValue("name") || ""}
                                className="w-[40px] h-[40px] object-cover rounded-xl"
                                loading="lazy"
                                // placeholder="blur"
                                quality={50}
                                sizes="40px"
                                // blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
                            />
                        ) : (
                            <LoadingImage
                                src={`/api/folders/${row.original.folder.id}/images/${row.original.id}`}
                                width={40}
                                height={40}
                                alt={row.getValue("name") || ""}
                                className="w-[40px] h-[40px] object-cover rounded-xl"
                                loading="lazy"
                                // placeholder="blur"
                                sizes="40px"
                                quality={50}
                                // blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
                            />
                        )}
                    </div>
                    <p>
                        <button
                            className="hover:underline"
                            onClick={() => {
                                if (setCarouselOpen && setStartIndex && row?.index !== undefined) {
                                    setStartIndex(row.index);
                                    setCarouselOpen(true);
                                }
                            }}
                        >
                            {`${row.getValue("name") || ""}.${row.original.extension || ""}`}
                        </button>
                    </p>
                </div>
            );
        },
        sortUndefined: "last",
        sortDescFirst: false,
    },
    {
        accessorKey: "folder_name",
        accessorFn: row => row?.folder?.name || "",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("header.folder")}</p>;
        },
    },
    {
        accessorKey: "size",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("header.size")}</p>;
        },
        cell: ({ row }) => <p>{formatBytes(row.original.size)}</p>,
    },
    {
        accessorKey: "comments",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("header.comments")}</p>;
        },
        cell: ({ table, row }) => {
            const t = table.options.meta?.intl?.translations;
            if (!row?.original?.comments) return <p>{t?.("columns.comments", { count: 0 })}</p>;

            return <p>{t?.("columns.comments", { count: row.original.comments.length })}</p>;
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("header.uploadedAt")}</p>;
        },
        cell: ({ table, row }) => {
            const formatter = table.options.meta?.intl?.formatter;

            return (
                <p className="capitalize">
                    {formatter?.dateTime(row.original.createdAt, {
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
        cell: ({ row, table }) => {
            if (!row?.original) return null;

            const t = table.options.meta?.intl?.translations;

            const setCarouselOpen = table.options.meta?.imagesListActions?.setCarouselOpen;
            const setStartIndex = table.options.meta?.imagesListActions?.setStartIndex;

            const states = table.options.meta?.states || {};
            const openRename = states.openRename as boolean;
            const openProperties = states.openProperties as boolean;
            const openDelete = states.openDelete as boolean;
            const setOpenRename = states.setOpenRename as React.Dispatch<React.SetStateAction<boolean>>;
            const setOpenDelete = states.setOpenDelete as React.Dispatch<React.SetStateAction<boolean>>;
            const setOpenProperties = states.setOpenProperties as React.Dispatch<React.SetStateAction<boolean>>;

            return (
                <>
                    <ImageActionsDropdown
                        row={row}
                        t={t}
                        setCarouselOpen={setCarouselOpen}
                        setStartIndex={setStartIndex}
                        setOpenRename={setOpenRename}
                        setOpenProperties={setOpenProperties}
                        setOpenDelete={setOpenDelete}
                    />
                    <RenameImageDialog file={row.original} openState={openRename} setOpenState={setOpenRename} />
                    <DeleteImageDialog file={row.original} open={openDelete} setOpen={setOpenDelete} />
                    <ImagePropertiesDialog file={row.original} open={openProperties} setOpen={setOpenProperties} />
                </>
            );
        },
        size: 50,
    },
];
