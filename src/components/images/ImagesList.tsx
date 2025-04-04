'use client'

import { FolderWithImagesWithFolderAndComments, FolderWithVideosWithFolderAndComments } from "@/lib/definitions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { imagesListViewColumns } from "./views/list/columns";
import React, { use, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon, Trash2, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { CarouselDialog } from "./CarouselDialog";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { DeleteMultipleImagesDialog } from "./DeleteMultipleImagesDialog";

export default function ImagesList({ folder }: { folder: FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments }) {

    const t = useTranslations("images.views.list.table");
    const [carouselOpen, setCarouselOpen] = React.useState<boolean>(false);
    const [startIndex, setStartIndex] = React.useState<number>(0);
    const [openDeleteSelection, setOpenDeleteSelection] = React.useState<boolean>(false);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        data: folder.images.concat(folder.videos),
        columns: imagesListViewColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            rowSelection,
        },
        enableSortingRemoval: false,
        meta: {
            imagesListActions: {
                setCarouselOpen,
                setStartIndex,
            }
        },
        getRowId: (row) => row.id,
    });

    return (
        <>
            {Object.keys(rowSelection).length > 0
                ? <div className={"flex justify-between items-center mb-5 bg-gray-50 rounded-2xl w-full p-2"}>
                    <div className={"flex gap-2 items-center"}>
                        <Button variant="ghost" onClick={() => { setRowSelection({}) }} size="icon"><X className={"w-4 h-4"} /></Button>
                        <h2><span className={"font-semibold"}>{t('selection', { count: Object.keys(rowSelection).length })}</span> - {formatBytes(folder.images.filter((i) => Object.keys(rowSelection).includes(i.id)).reduce((a, b) => a + b.size, 0), { decimals: 2, sizeType: "normal" })}</h2>
                    </div>

                    <Button variant="outline" onClick={() => {
                        setOpenDeleteSelection(true);
                    }}>
                        <Trash2 className={"mr-2"} /> {t('deleteSelected')}
                    </Button>
                </div>
                : null
            }
            <Table className="w-full">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead
                                        key={header.id}
                                        aria-sort={
                                            header.column.getIsSorted() === "asc"
                                                ? "ascending"
                                                : header.column.getIsSorted() === "desc"
                                                    ? "descending"
                                                    : "none"
                                        }
                                        {...{
                                            colSpan: header.colSpan,
                                            style: {
                                                width: header.getSize(),
                                            },
                                        }}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={cn(
                                                    header.column.getCanSort() &&
                                                    "flex h-full cursor-pointer items-center justify-between gap-2 select-none",
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                                onKeyDown={(e) => {
                                                    // Enhanced keyboard handling for sorting
                                                    if (header.column.getCanSort() && (e.key === "Enter" || e.key === " ")) {
                                                        e.preventDefault();
                                                        header.column.getToggleSortingHandler()?.(e);
                                                    }
                                                }}
                                                tabIndex={header.column.getCanSort() ? 0 : undefined}
                                            >
                                                <span className="truncate">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                {{
                                                    asc: (
                                                        <ChevronUpIcon
                                                            className="shrink-0 opacity-60"
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                    ),
                                                    desc: (
                                                        <ChevronDownIcon
                                                            className="shrink-0 opacity-60"
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                    ),
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="truncate">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={imagesListViewColumns.length} className="h-24 text-center">
                                { t('empty') }
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <CarouselDialog files={folder.images.concat(folder.videos)} title={folder.name} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteMultipleImagesDialog images={Object.keys(rowSelection)} open={openDeleteSelection} setOpen={setOpenDeleteSelection} onDelete={() => {
                setRowSelection({});
            }} />
        </>
    )
}