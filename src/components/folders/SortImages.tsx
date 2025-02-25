'use client'

import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ArrowDown, ArrowDownWideNarrow, ArrowUp, ChevronDown } from "lucide-react";
import React from "react";

export interface SortImagesProps {
    sortState: "name-asc" | "name-desc" | "size-asc" | "size-desc" | "date-asc" | "date-desc" | null;
    setSortState: React.Dispatch<React.SetStateAction<"name-asc" | "name-desc" | "size-asc" | "size-desc" | "date-asc" | "date-desc" | null>>;
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
                    if (sortState === "name-desc") {
                        setSortState("name-asc");
                    } else {
                        setSortState("name-desc")
                    }
                }}>
                    {t('options.name')}
                    {sortState === "name-asc"
                        ? <ArrowUp className="w-4 h-4" />
                        : null
                    }
                    {sortState === "name-desc"
                        ? <ArrowDown className="w-4 h-4" />
                        : null
                    }
                </DropdownMenuItem>
                <DropdownMenuItem className="flex justify-between items-center" onClick={(event) => {
                    event.preventDefault();
                    if (sortState === "size-desc") {
                        setSortState("size-asc");
                    } else {
                        setSortState("size-desc")
                    }
                }}>
                    {t('options.size')}
                    {sortState === "size-asc"
                        ? <ArrowUp className="w-4 h-4" />
                        : null
                    }
                    {sortState === "size-desc"
                        ? <ArrowDown className="w-4 h-4" />
                        : null
                    }
                </DropdownMenuItem>
                <DropdownMenuItem className="flex justify-between items-center" onClick={(event) => {
                    event.preventDefault();
                    if (sortState === "date-desc") {
                        setSortState("date-asc");
                    } else {
                        setSortState("date-desc")
                    }
                }}>
                    {t('options.date')}
                    {sortState === "date-asc"
                        ? <ArrowUp className="w-4 h-4" />
                        : null
                    }
                    {sortState === "date-desc"
                        ? <ArrowDown className="w-4 h-4" />
                        : null
                    }
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}