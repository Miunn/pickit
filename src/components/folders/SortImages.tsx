"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";
import React, { useMemo } from "react";
import { FilesSort, FilesSortDefinition, parseFilesSort, SortAttribute } from "@/types/imagesSort";
import SortArrow from "@/components/generic/SortArrow";

export interface SortImagesProps {
	readonly sortState: FilesSortDefinition;
	readonly setSortState: React.Dispatch<React.SetStateAction<FilesSortDefinition>>;
}

export default function SortImages({ sortState, setSortState }: SortImagesProps) {
	const t = useTranslations("components.images.sort");
	const { attribute, direction } = useMemo(() => parseFilesSort(sortState), [sortState]);

	const handleSortChange = (sortAttribute: SortAttribute) => {
		if (sortAttribute === SortAttribute.Position) {
			setSortState(FilesSort.Position);
			return;
		}

		if (attribute === sortAttribute) {
			setSortState(
				direction === "Asc" ? FilesSort[sortAttribute].Desc : FilesSort[sortAttribute].Asc
			);
			return;
		}

		setSortState(FilesSort[sortAttribute].Asc);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant={"outline"}>
					<ArrowDownWideNarrow className="mr-2 shrink-0" />
					{t("trigger")}
					<ChevronDown
						className="-me-1 ms-2 opacity-60 shrink-0"
						size={16}
						strokeWidth={2}
						aria-hidden="true"
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="min-w-[--radix-dropdown-menu-trigger-width]">
				<DropdownMenuItem
					className="flex justify-between items-center"
					onClick={e => {
						e.preventDefault();
						handleSortChange(SortAttribute.Position);
					}}
				>
					{t("options.manual")}
					{sortState === FilesSort.Position ? <Check className="w-4 h-4" /> : null}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex justify-between items-center"
					onClick={e => {
						e.preventDefault();
						handleSortChange(SortAttribute.Name);
					}}
				>
					{t("options.name")}
					<SortArrow direction={attribute === SortAttribute.Name ? direction : null} />
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex justify-between items-center"
					onClick={e => {
						e.preventDefault();
						handleSortChange(SortAttribute.Size);
					}}
				>
					{t("options.size")}
					<SortArrow direction={attribute === SortAttribute.Size ? direction : null} />
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex justify-between items-center"
					onClick={e => {
						e.preventDefault();
						handleSortChange(SortAttribute.Date);
					}}
				>
					{t("options.date")}
					<SortArrow direction={attribute === SortAttribute.Date ? direction : null} />
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex justify-between items-center"
					onClick={e => {
						e.preventDefault();
						handleSortChange(SortAttribute.Taken);
					}}
				>
					{t("options.taken")}
					<SortArrow direction={attribute === SortAttribute.Taken ? direction : null} />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
