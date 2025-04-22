'use client'

import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ArrowDown, ArrowDownWideNarrow, ArrowUp, ChevronDown } from "lucide-react";
import React from "react";

export enum ImagesSortMethod {
    NameAsc = "name-asc",
    NameDesc = "name-desc",
    SizeAsc = "size-asc",
    SizeDesc = "size-desc",
    DateAsc = "date-asc",
    DateDesc = "date-desc",
    PositionAsc = "position-asc",
    PositionDesc = "position-desc",
}

export interface SortImagesProps {
    sortState: ImagesSortMethod;
    setSortState: React.Dispatch<React.SetStateAction<ImagesSortMethod>>;
}

export default function SortImages({ sortState, setSortState }: SortImagesProps) {

    const t = useTranslations("components.images.sort");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={"outline"} className="w-32">
                    <ArrowDownWideNarrow className="mr-2" />
                    {t('trigger')}
                    <ChevronDown
                        className="-me-1 ms-2 opacity-60"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                    /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem className="flex justify-between items-center" onClick={(event) => {
                    event.preventDefault();
                    if (sortState === ImagesSortMethod.NameDesc) {
                        setSortState(ImagesSortMethod.NameAsc);
                    } else {
                        setSortState(ImagesSortMethod.NameDesc)
                    }
                }}>
                    {t('options.name')}
                    {sortState === ImagesSortMethod.NameAsc
                        ? <ArrowUp className="w-4 h-4" />
                        : null
                    }
                    {sortState === ImagesSortMethod.NameDesc
                        ? <ArrowDown className="w-4 h-4" />
                        : null
                    }
                </DropdownMenuItem>
                <DropdownMenuItem className="flex justify-between items-center" onClick={(event) => {
                    event.preventDefault();
                    if (sortState === ImagesSortMethod.SizeDesc) {
                        setSortState(ImagesSortMethod.SizeAsc);
                    } else {
                        setSortState(ImagesSortMethod.SizeDesc)
                    }
                }}>
                    {t('options.size')}
                    {sortState === ImagesSortMethod.SizeAsc
                        ? <ArrowUp className="w-4 h-4" />
                        : null
                    }
                    {sortState === ImagesSortMethod.SizeDesc
                        ? <ArrowDown className="w-4 h-4" />
                        : null
                    }
                </DropdownMenuItem>
                <DropdownMenuItem className="flex justify-between items-center" onClick={(event) => {
                    event.preventDefault();
                    if (sortState === ImagesSortMethod.DateDesc) {
                        setSortState(ImagesSortMethod.DateAsc);
                    } else {
                        setSortState(ImagesSortMethod.DateDesc)
                    }
                }}>
                    {t('options.date')}
                    {sortState === ImagesSortMethod.DateAsc
                        ? <ArrowUp className="w-4 h-4" />
                        : null
                    }
                    {sortState === ImagesSortMethod.DateDesc
                        ? <ArrowDown className="w-4 h-4" />
                        : null
                    }
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}