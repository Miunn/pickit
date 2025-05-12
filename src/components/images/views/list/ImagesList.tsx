'use client'

import { FolderWithFilesWithFolderAndComments } from "@/lib/definitions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table";
import { flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable, getPaginationRowModel } from "@tanstack/react-table";
import { imagesListViewColumns } from "./columns";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ChevronLeft, ChevronRight, ChevronUpIcon, Loader2, Trash2, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { CarouselDialog } from "../../carousel/CarouselDialog";
import { Button } from "../../../ui/button";
import { useTranslations } from "next-intl";
import { DeleteMultipleImagesDialog } from "../../DeleteMultipleImagesDialog";
import { Select, SelectItem, SelectContent, SelectValue, SelectTrigger } from "../../../ui/select";
import { useFolderContext } from "@/context/FolderContext";
export default function ImagesList() {
    const t = useTranslations("images.views.list.table");
    const { folder } = useFolderContext();
    const [carouselOpen, setCarouselOpen] = React.useState<boolean>(false);
    const [startIndex, setStartIndex] = React.useState<number>(0);
    const [openDeleteSelection, setOpenDeleteSelection] = React.useState<boolean>(false);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({})
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Reference to the table container for virtualization
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Ensure folder data is available
    useEffect(() => {
        if (folder && folder.files) {
            setIsLoading(false);
        }
    }, [folder]);

    // Prepare data safely
    const tableData = React.useMemo(() => {
        if (!folder || !folder.files) return [];
        return folder.files.sort((a, b) => a.position - b.position) || [];
    }, [folder]);

    const table = useReactTable({
        data: tableData,
        columns: imagesListViewColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        state: {
            sorting,
            rowSelection,
            pagination
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

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">
            <Loader2 className="w-4 h-4 animate-spin" />
        </div>;
    }

    return (
        <>
            <div className="flex items-center justify-between py-4">
                <div>
                    <p className="text-sm truncate">{folder.description}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <p className="text-sm">
                        {t('page.label', { 
                            pageStart: (table.getState().pagination.pageIndex * table.getState().pagination.pageSize) + 1, 
                            pageEnd: Math.min(
                                (table.getState().pagination.pageIndex * table.getState().pagination.pageSize) + table.getState().pagination.pageSize,
                                tableData.length
                            ), 
                            count: tableData.length 
                        })}
                    </p>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Select
                        value={table.getState().pagination.pageSize.toString()}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value))
                        }}
                    >
                        <SelectTrigger className="w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 30, 40, 50].map(pageSize => (
                                <SelectItem key={pageSize} value={pageSize.toString()}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {Object.keys(rowSelection).length > 0
                ? <div className={"flex justify-between items-center mb-5 bg-gray-50 rounded-2xl w-full p-2"}>
                    <div className={"flex gap-2 items-center"}>
                        <Button variant="ghost" onClick={() => { setRowSelection({}) }} size="icon"><X className={"w-4 h-4"} /></Button>
                        <h2><span className={"font-semibold"}>{t('selection', { count: Object.keys(rowSelection).length })}</span> - {formatBytes(folder.files?.filter((i) => Object.keys(rowSelection).includes(i.id)).reduce((a, b) => a + b.size, 0) || 0, { decimals: 2, sizeType: "normal" })}</h2>
                    </div>

                    <Button variant="outline" onClick={() => {
                        setOpenDeleteSelection(true);
                    }}>
                        <Trash2 className={"mr-2"} /> {t('deleteSelected')}
                    </Button>
                </div>
                : null
            }
            <div ref={tableContainerRef} className="overflow-auto" style={{ height: 'calc(100vh - 250px)' }}>
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
                                            <div
                                                className={cn(
                                                    header.column.getCanSort() &&
                                                    "flex h-full cursor-pointer items-center justify-between gap-2 select-none",
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                                onKeyDown={(e) => {
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
                                    {t('empty')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <CarouselDialog files={tableData} title={folder.name} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteMultipleImagesDialog files={tableData.filter((file) => Object.keys(rowSelection).includes(file.id))} open={openDeleteSelection} setOpen={setOpenDeleteSelection} onDelete={() => {
                setRowSelection({});
            }} />
        </>
    )
}