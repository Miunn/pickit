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
import { ArrowDown, ArrowUp, Check, LayoutGrid, List, MoreHorizontal, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { ViewState } from "../ViewSelector";
import { ImagesSortMethod } from "@/types/imagesSort";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/SessionProvider";
import { UploadImagesDialog } from "@/components/files/upload/UploadImagesDialog";
import { ShareFolderDialog } from "../dialogs/ShareFolderDialog";
import { useState } from "react";

export default function FolderActionDropdownMobile() {
	const t = useTranslations("folders");
	const { files, viewState, sortState, setViewState, setSortState, setFiles } = useFilesContext();
	const { folder, token, tokenHash, isShared } = useFolderContext();
	const { isGuest } = useSession();

	const [openUpload, setOpenUpload] = useState(false);
	const [openShare, setOpenShare] = useState(false);

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
									onClick={event => {
										event.preventDefault();
										setSortState(ImagesSortMethod.Position);
									}}
								>
									{t("sort.options.manual")}
									{sortState === ImagesSortMethod.Position ? (
										<Check className="w-4 h-4" />
									) : null}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={event => {
										event.preventDefault();
										if (
											sortState ===
											ImagesSortMethod.NameDesc
										) {
											setSortState(
												ImagesSortMethod.NameAsc
											);
										} else {
											setSortState(
												ImagesSortMethod.NameDesc
											);
										}
									}}
									className="flex justify-between items-center gap-3"
								>
									{t("sort.options.name")}
									{sortState === ImagesSortMethod.NameAsc ? (
										<ArrowUp className="w-4 h-4" />
									) : null}
									{sortState === ImagesSortMethod.NameDesc ? (
										<ArrowDown className="w-4 h-4" />
									) : null}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={event => {
										event.preventDefault();
										if (
											sortState ===
											ImagesSortMethod.SizeDesc
										) {
											setSortState(
												ImagesSortMethod.SizeAsc
											);
										} else {
											setSortState(
												ImagesSortMethod.SizeDesc
											);
										}
									}}
									className="flex justify-between items-center gap-3"
								>
									{t("sort.options.size")}
									{sortState === ImagesSortMethod.SizeAsc ? (
										<ArrowUp className="w-4 h-4" />
									) : null}
									{sortState === ImagesSortMethod.SizeDesc ? (
										<ArrowDown className="w-4 h-4" />
									) : null}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={event => {
										event.preventDefault();
										if (
											sortState ===
											ImagesSortMethod.DateDesc
										) {
											setSortState(
												ImagesSortMethod.DateAsc
											);
										} else {
											setSortState(
												ImagesSortMethod.DateDesc
											);
										}
									}}
									className="flex justify-between items-center gap-3"
								>
									{t("sort.options.date")}
									{sortState === ImagesSortMethod.DateAsc ? (
										<ArrowUp className="w-4 h-4" />
									) : null}
									{sortState === ImagesSortMethod.DateDesc ? (
										<ArrowDown className="w-4 h-4" />
									) : null}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="flex justify-between items-center"
									onClick={event => {
										event.preventDefault();
										if (
											sortState ===
											ImagesSortMethod.TakenDesc
										) {
											setSortState(
												ImagesSortMethod.TakenAsc
											);
										} else {
											setSortState(
												ImagesSortMethod.TakenDesc
											);
										}
									}}
								>
									{t("sort.options.taken")}
									{sortState === ImagesSortMethod.TakenAsc ? (
										<ArrowUp className="w-4 h-4" />
									) : null}
									{sortState === ImagesSortMethod.TakenDesc ? (
										<ArrowDown className="w-4 h-4" />
									) : null}
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
