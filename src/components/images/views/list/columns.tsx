import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { ImageWithComments, ImageWithFolder } from "@/lib/definitions";
import { downloadClientImageHandler, formatBytes } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import RenameImageDialog from "../../RenameImageDialog";
import { DeleteImageDialog } from "../../DeleteImageDialog";
import ImagePropertiesDialog from "../../ImagePropertiesDialog";
import { useState } from "react";

export const imagesListViewColumns: ColumnDef<ImageWithFolder & ImageWithComments>[] = [
    {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => <div className="truncate font-medium flex items-center gap-2">
            <Image src={`/api/folders/${row.original.folder.id}/images/${row.original.id}`} width={40} height={40} alt={row.getValue("name")} className="w-[40px] h-[40px] object-cover rounded-xl" />
            <p>{`${row.getValue("name")}.${row.original.extension}`}</p>
        </div>,
        sortUndefined: "last",
        sortDescFirst: false,
    },
    {
        accessorKey: "folder_name",
        accessorFn: (row) => row.folder.name,
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

            return <p>{formatter.dateTime(row.original.createdAt, {
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
            const t = useTranslations("images.views.list.columns.actions");

            const setCarouselOpen = table.options.meta?.imagesListActions?.setCarouselOpen;
            const setStartIndex = table.options.meta?.imagesListActions?.setStartIndex;

            const [openRename, setOpenRename] = useState<boolean>(false);
            const [openProperties, setOpenProperties] = useState<boolean>(false);
            const [openDelete, setOpenDelete] = useState<boolean>(false);

            return <>
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
                            if (setCarouselOpen && setStartIndex) {
                                setStartIndex(row.index);
                                setCarouselOpen(true);
                            }
                        }}>{t('view')}</DropdownMenuItem>
                        <DropdownMenuItem>{t('select')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadClientImageHandler(row.original)}>{t('download')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenRename(true)}>{t('rename')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenProperties(true)}>{t('properties')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-destructive focus:text-destructive font-semibold">{t('delete')}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <RenameImageDialog image={row.original} openState={openRename} setOpenState={setOpenRename} />
                <DeleteImageDialog image={row.original} open={openDelete} setOpen={setOpenDelete} />
                <ImagePropertiesDialog image={row.original} open={openProperties} setOpen={setOpenProperties} />
            </>
        },
        size: 50
    }
];