import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { FileWithComments, FileWithFolder } from "@/lib/definitions";
import { downloadClientImageHandler, formatBytes } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import RenameImageDialog from "../../RenameImageDialog";
import { DeleteImageDialog } from "../../DeleteImageDialog";
import ImagePropertiesDialog from "../../ImagePropertiesDialog";
import React, { useState, useMemo, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { changeFolderCover } from "@/actions/folders";
import LoadingImage from "@/components/LoadingImage";
import { FileType } from "@prisma/client";

// Memoized dropdown menu component
const ImageActionsDropdown = React.memo(({
    row,
    t,
    setCarouselOpen,
    setStartIndex,
    setOpenRename,
    setOpenProperties,
    setOpenDelete
}: {
    row: any,
    t: any,
    setCarouselOpen: any,
    setStartIndex: any,
    setOpenRename: any,
    setOpenProperties: any,
    setOpenDelete: any
}) => {
    const handleSetAsCover = useCallback(async () => {
        if (!row?.original?.folderId || !row?.original?.id) return;

        const r = await changeFolderCover(row.original.folderId, row.original.id);

        if (r.error) {
            toast({
                title: t('setAsCover.error.title'),
                description: t('setAsCover.error.description'),
                variant: "destructive"
            });
            return;
        }

        toast({
            title: t('setAsCover.success.title'),
            description: t('setAsCover.success.description')
        });
    }, [row?.original?.folderId, row?.original?.id, t]);

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                    if (setCarouselOpen && setStartIndex && row?.index !== undefined) {
                        setStartIndex(row.index);
                        setCarouselOpen(true);
                    }
                }}>{t('view')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => row?.toggleSelected && row.toggleSelected(!row.getIsSelected())}>
                    {row?.getIsSelected()
                        ? t('deselect')
                        : t('select')
                    }
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => row?.original && downloadClientImageHandler(row.original)}>{t('download')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenRename(true)}>{t('rename')}</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSetAsCover}>{t('setAsCover.label')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenProperties(true)}>{t('properties')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-destructive focus:text-destructive font-semibold">{t('delete')}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

ImageActionsDropdown.displayName = 'ImageActionsDropdown';

export const imagesListViewColumns: ColumnDef<FileWithFolder & FileWithComments>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 25
    },
    {
        header: "Name",
        accessorKey: "name",
        cell: ({ row, table }) => {
            if (!row?.original) return null;

            const setCarouselOpen = table.options.meta?.imagesListActions?.setCarouselOpen;
            const setStartIndex = table.options.meta?.imagesListActions?.setStartIndex;

            return <div className="truncate font-medium flex items-center gap-2">
                <div className="relative w-[40px] h-[40px]">
                    {row.original.type === FileType.VIDEO
                        ? <LoadingImage
                            src={`/api/folders/${row.original.folder.id}/videos/${row.original.id}/thumbnail`}
                            width={40}
                            height={40}
                            alt={row.getValue("name") || ''}
                            className="w-[40px] h-[40px] object-cover rounded-xl"
                            loading="lazy"
                            // placeholder="blur"
                            quality={50}
                            sizes="40px"
                        // blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
                        />
                        : <LoadingImage
                            src={`/api/folders/${row.original.folder.id}/images/${row.original.id}`}
                            width={40}
                            height={40}
                            alt={row.getValue("name") || ''}
                            className="w-[40px] h-[40px] object-cover rounded-xl"
                            loading="lazy"
                            // placeholder="blur"
                            sizes="40px"
                            quality={50}
                        // blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
                        />
                    }
                </div>
                <p onClick={() => {
                    if (setCarouselOpen && setStartIndex && row?.index !== undefined) {
                        setStartIndex(row.index);
                        setCarouselOpen(true);
                    }
                }} className="hover:underline cursor-pointer">{`${row.getValue("name") || ''}.${row.original.extension || ''}`}</p>
            </div>
        },
        sortUndefined: "last",
        sortDescFirst: false,
    },
    {
        accessorKey: "folder_name",
        accessorFn: (row) => row?.folder?.name || '',
        header: () => {
            const t = useTranslations("images.views.list.header");
            return (
                <p>{t('folder')}</p>
            )
        },
    },
    {
        accessorKey: "size",
        header: () => {
            const t = useTranslations("images.views.list.header");
            return (
                <p>{t('size')}</p>
            )
        },
        cell: ({ row }) => (
            <p>{formatBytes(row.original.size)}</p>
        ),
    },
    {
        accessorKey: "comments",
        header: () => {
            const t = useTranslations("images.views.list.header");
            return (
                <p>{t('comments')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("images.views.list.columns");
            if (!row?.original?.comments) return <p>{t('comments', { count: 0 })}</p>;

            return <p>{t('comments', { count: row.original.comments.length })}</p>
        }
    },
    {
        accessorKey: "createdAt",
        header: () => {
            const t = useTranslations("images.views.list.header");
            return (
                <p>{t('uploadedAt')}</p>
            )
        },
        cell: ({ row }) => {
            const formatter = useFormatter();

            return <p className="capitalize">{formatter.dateTime(row.original.createdAt, {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "numeric"
            })}</p>
        },
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            if (!row?.original) return null;

            const t = useTranslations("images.views.list.columns.actions");

            const setCarouselOpen = table.options.meta?.imagesListActions?.setCarouselOpen;
            const setStartIndex = table.options.meta?.imagesListActions?.setStartIndex;

            const [openRename, setOpenRename] = useState<boolean>(false);
            const [openProperties, setOpenProperties] = useState<boolean>(false);
            const [openDelete, setOpenDelete] = useState<boolean>(false);

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
        size: 50
    }
];