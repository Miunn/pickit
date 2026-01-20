import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFilesContext } from "@/context/FilesContext";
import { useFolderContext } from "@/context/FolderContext";
import { Check, LayoutGrid, List, MoreHorizontal, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { ViewState } from "../ViewSelector";
import { FilesSort, parseFilesSort, SortAttribute, SortDirection } from "@/types/imagesSort";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/SessionProvider";
import { UploadImagesDialog } from "@/components/files/upload/UploadImagesDialog";
import { ShareFolderDialog } from "../dialogs/ShareFolderDialog";
import { useMemo, useState } from "react";
import SortArrow from "@/components/generic/SortArrow";

export default function FolderActionDropdownMobile() {
	const t = useTranslations("folders");
	const { files, viewState, sortState, setViewState, setSortState, setFiles } = useFilesContext();
	const { folder, token, tokenHash, isShared } = useFolderContext();
	const { isGuest } = useSession();
	const { attribute: sortAttribute, direction: sortDirection } = useMemo(
		() => parseFilesSort(sortState),
		[sortState]
	);

	const [openUpload, setOpenUpload] = useState(false);
	const [openShare, setOpenShare] = useState(false);

	const handleSortChange = (attribute: SortAttribute) => {
		if (attribute === SortAttribute.Position) {
			setSortState(FilesSort.Position);
			return;
		}

		const { attribute: currentAttribute, direction } = parseFilesSort(sortState);

		if (currentAttribute === attribute) {
			setSortState(direction === "Asc" ? FilesSort[attribute].Desc : FilesSort[attribute].Asc);
			return;
		}

		setSortState(FilesSort[attribute].Asc);
	};

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger>
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
									<LayoutGrid className="w-4 h-4" />{" "}
									{t("views.options.grid")}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setViewState(ViewState.List)}
									className="flex items-center gap-3"
								>
									<List className="w-4 h-4" />{" "}
									{t("views.options.list")}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										setViewState(ViewState.TagGrouped)
									}
									className="flex items-center gap-3"
								>
									<Tag className="w-4 h-4" />{" "}
									{t("views.options.tagGrouped")}
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
					{viewState === ViewState.Grid ? (
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								{t("sort.label")}
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								<DropdownMenuItem
									className="flex justify-between items-center"
									onClick={e => {
										e.preventDefault();
										handleSortChange(
											SortAttribute.Position
										);
									}}
								>
									{t("sort.options.manual")}
									{sortState === FilesSort.Position ? (
										<Check className="w-4 h-4" />
									) : null}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={e => {
										e.preventDefault();
										handleSortChange(SortAttribute.Name);
									}}
									className="flex justify-between items-center gap-3"
								>
									{t("sort.options.name")}
									<SortArrow
										direction={
											sortAttribute ===
											SortAttribute.Name
												? sortDirection
												: null
										}
									/>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={e => {
										e.preventDefault();
										handleSortChange(SortAttribute.Size);
									}}
									className="flex justify-between items-center gap-3"
								>
									{t("sort.options.size")}
									<SortArrow
										direction={
											sortAttribute ===
											SortAttribute.Size
												? sortDirection
												: null
										}
									/>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={e => {
										e.preventDefault();
										handleSortChange(SortAttribute.Date);
									}}
									className="flex justify-between items-center gap-3"
								>
									{t("sort.options.date")}
									<SortArrow
										direction={
											sortAttribute ===
											SortAttribute.Date
												? sortDirection
												: null
										}
									/>
								</DropdownMenuItem>
								<DropdownMenuItem
									className="flex justify-between items-center"
									onClick={e => {
										e.preventDefault();
										handleSortChange(SortAttribute.Taken);
									}}
								>
									{t("sort.options.taken")}
									<SortArrow
										direction={
											sortAttribute ===
											SortAttribute.Taken
												? sortDirection
												: null
										}
									/>
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					) : null}
					<DropdownMenuItem
						className={cn(isGuest && !token?.allowMap && "hidden")}
						asChild
					>
						<Link href={`/app/map?share=${token?.token}&h=${tokenHash}`}>
							{t("actions.map")}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						className={cn(isGuest && "hidden")}
						onClick={() => setOpenUpload(true)}
					>
						{t("upload.label")}
					</DropdownMenuItem>
					<DropdownMenuItem
						className={cn(isGuest && "hidden")}
						onClick={() => setOpenShare(true)}
					>
						{t("share.label")}
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<a
							href={`/api/folders/${folder.id}/download?share==${token?.token}&h=${tokenHash}`}
							download
						>
							{t("download.label")}
						</a>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
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
