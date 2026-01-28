import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	FolderWithAccessToken,
	FolderWithFilesCount,
	FileWithComments,
	FolderWithFilesWithFolderAndComments,
	FolderWithTags,
	FileWithTags,
	FolderWithLastSlug,
} from "@/lib/definitions";
import { formatBytes } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Images, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import RenameFolderDialog from "@/components/folders/dialogs/RenameFolderDialog";
import DeleteFolderDialog from "@/components/folders/dialogs/DeleteFolderDialog";
import FolderPropertiesDialog from "@/components/folders/dialogs/FolderPropertiesDialogs";
import Link from "next/link";
import { ShareFolderDialog } from "@/components/folders/dialogs/ShareFolderDialog";
import ChangeCoverFolderDialog from "@/components/folders/dialogs/ChangeCoverFolderDialog";
import { getImagesWithFolderAndCommentsFromFolder } from "@/actions/files";
import { select } from "@/lib/columns-common";

export const foldersListViewColumns: ColumnDef<
	FolderWithLastSlug & FolderWithAccessToken & FolderWithFilesCount & FolderWithFilesWithFolderAndComments
>[] = [
	select as ColumnDef<
		FolderWithLastSlug & FolderWithAccessToken & FolderWithFilesCount & FolderWithFilesWithFolderAndComments
	>,
	{
		header: "Name",
		accessorKey: "name",
		cell: ({ row }) => (
			<div className="truncate font-medium flex items-center gap-2">
				{row.original.coverId ? (
					<Image
						src={`/api/folders/${row.original.id}/images/${row.original.coverId}`}
						width={40}
						height={40}
						alt={row.getValue("name")}
						className="w-[40px] h-[40px] object-cover rounded-xl"
					/>
				) : (
					<div
						className={
							"w-[40px] h-[40px] bg-gray-100 dark:bg-gray-800 rounded-xl flex justify-center items-center"
						}
					>
						<Images className={"opacity-50 w-[20px] h-[20px]"} />
					</div>
				)}

				<Link href={`/app/folders/${row.original.slug}`} className="hover:underline">
					{row.getValue("name")}
				</Link>
			</div>
		),
		sortUndefined: "last",
		sortDescFirst: false,
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
		accessorKey: "createdAt",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("header.createdAt")}</p>;
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
		accessorKey: "updatedAt",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("header.updatedAt")}</p>;
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
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;

			const states = table.options.meta?.states;
			const folderImages = states?.folderImages as ({ folder: FolderWithTags } & FileWithTags &
				FileWithComments)[];
			const setFolderImages = states?.setFolderImages as React.Dispatch<
				React.SetStateAction<
					({
						folder: FolderWithTags;
					} & FileWithTags &
						FileWithComments)[]
				>
			>;
			const openShare = states?.openShare as boolean;
			const setOpenShare = states?.setOpenShare as React.Dispatch<React.SetStateAction<boolean>>;
			const openChangeCover = states?.openChangeCover as boolean;
			const setOpenChangeCover = states?.setOpenChangeCover as React.Dispatch<
				React.SetStateAction<boolean>
			>;
			const openRename = states?.openRename as boolean;
			const setOpenRename = states?.setOpenRename as React.Dispatch<React.SetStateAction<boolean>>;
			const openProperties = states?.openProperties as boolean;
			const setOpenProperties = states?.setOpenProperties as React.Dispatch<
				React.SetStateAction<boolean>
			>;
			const openDelete = states?.openDelete as boolean;
			const setOpenDelete = states?.setOpenDelete as React.Dispatch<React.SetStateAction<boolean>>;

			const loadImages = async () => {
				setFolderImages(
					(await getImagesWithFolderAndCommentsFromFolder(row.original.id)).images
				);
			};

			return (
				<>
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-40">
							<DropdownMenuLabel>
								{t?.("columns.actions.label")}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link href={`/app/folders/${row.original.slug}`}>
									{t?.("columns.actions.open")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => row.toggleSelected(!row.getIsSelected())}
							>
								{row.getIsSelected()
									? t?.("columns.actions.deselect")
									: t?.("columns.actions.select")}
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<a
									href={`/api/folders/${row.original.id}/download`}
									download
								>
									{t?.("columns.actions.download")}
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setOpenShare(true)}>
								{t?.("columns.actions.share")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									loadImages();
									setOpenChangeCover(true);
								}}
							>
								{t?.("columns.actions.changeCover")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setOpenRename(true)}>
								{t?.("columns.actions.rename")}
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
					<ShareFolderDialog
						folder={row.original}
						open={openShare}
						setOpen={setOpenShare}
					/>
					<ChangeCoverFolderDialog
						folderId={row.original.id}
						images={folderImages}
						open={openChangeCover}
						setOpen={setOpenChangeCover}
					/>
					<RenameFolderDialog
						folderId={row.original.id}
						folderName={row.original.name}
						openState={openRename}
						setOpenState={setOpenRename}
					/>
					<DeleteFolderDialog
						folderId={row.original.id}
						folderName={row.original.name}
						openState={openDelete}
						setOpenState={setOpenDelete}
					/>
					<FolderPropertiesDialog
						folder={row.original}
						open={openProperties}
						setOpen={setOpenProperties}
					/>
				</>
			);
		},
		size: 50,
	},
];
