"use client";

import {
	FileWithComments,
	FileWithTags,
	FolderWithAccessToken,
	FolderWithCover,
	FolderWithFilesCount,
	FolderWithLastSlug,
	FolderWithTags,
} from "@/lib/definitions";
import { useFormatter, useTranslations } from "next-intl";
import React from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "../../../ui/context-menu";
import Image from "next/image";
import { Images } from "lucide-react";
import { Separator } from "../../../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../ui/tooltip";
import RenameFolderDialog from "../../dialogs/RenameFolderDialog";
import ChangeCoverFolderDialog from "../../dialogs/ChangeCoverFolderDialog";
import { ShareFolderDialog } from "../../dialogs/ShareFolderDialog";
import DeleteFolderDialog from "../../dialogs/DeleteFolderDialog";
import { FileType } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import FolderPropertiesDialog from "../../dialogs/FolderPropertiesDialogs";

/**
 * Render a clickable folder card showing cover (or placeholder), name, file count, and creation date, with a context menu for folder actions and dialogs for rename, change cover, share, properties, and delete.
 *
 * @param folder - The folder to display; must include cover and coverId (when present), a files array (each file includes tags and comments), a file count property (`_count.files`), and access token/metadata required for folder actions.
 * @returns A React element containing the folder preview, its context menu actions, and the associated dialogs
 */
export default function FolderPreviewGrid({
	folder,
}: {
	readonly folder: FolderWithLastSlug &
		FolderWithAccessToken &
		FolderWithFilesCount &
		FolderWithCover & { files: ({ folder: FolderWithTags } & FileWithTags & FileWithComments)[] };
}) {
	const t = useTranslations("folders");
	const dialogsTranslations = useTranslations("dialogs.folders");
	const format = useFormatter();

	const [openRename, setOpenRename] = React.useState<boolean>(false);
	const [openChangeCover, setOpenChangeCover] = React.useState<boolean>(false);
	const [openShare, setOpenShare] = React.useState<boolean>(false);
	const [openProperties, setOpenProperties] = React.useState<boolean>(false);
	const [openDelete, setOpenDelete] = React.useState<boolean>(false);

	return (
		<>
			<ContextMenu modal={false}>
				<ContextMenuTrigger asChild>
					<Link
						href={`/app/folders/${folder.slugs[0].slug}`}
						className={"inline-block w-full"}
					>
						{folder.cover ? (
							<div
								className={`relative h-36 mb-4 flex justify-center items-center border border-primary rounded-xl`}
							>
								<Image
									src={`/api/folders/${folder.id}/images/${folder.coverId}`}
									alt={folder.cover.name}
									className={"relative rounded-xl object-cover"}
									sizes="33vw"
									fill
								/>
							</div>
						) : (
							<div
								className={
									"border border-primary rounded-xl bg-gray-100 dark:bg-gray-800 h-36 mb-4 flex justify-center items-center"
								}
							>
								<Images className={"opacity-50 dark:text-gray-400"} />
							</div>
						)}
						<p className="truncate">{folder.name}</p>
						<div className={"text-sm flex h-4 items-center flex-nowrap"}>
							<p className={"opacity-60 text-nowrap"}>
								{t("filesCount", { count: folder._count.files })}
							</p>
							<Separator className="mx-2" orientation="vertical" />
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<p
											className={
												"opacity-60 capitalize truncate"
											}
										>
											{format.dateTime(
												folder.createdAt,
												{
													day: "numeric",
													month: "short",
													year: "numeric",
												}
											)}
										</p>
									</TooltipTrigger>
									<TooltipContent>
										<p className={"capitalize"}>
											{format.dateTime(
												folder.createdAt,
												{
													weekday: "long",
													day: "numeric",
													month: "short",
													year: "numeric",
													hour: "numeric",
													minute: "numeric",
												}
											)}
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</Link>
				</ContextMenuTrigger>
				<ContextMenuContent className="w-48">
					<ContextMenuItem asChild>
						<Link href={`/app/folders/${folder.slugs[0].slug}`}>
							{t("actions.open")}
						</Link>
					</ContextMenuItem>
					<ContextMenuItem onClick={() => setOpenRename(true)}>
						{dialogsTranslations("rename.trigger")}
					</ContextMenuItem>
					<ContextMenuItem
						onClick={() => setOpenChangeCover(true)}
						disabled={folder.files.length === 0}
					>
						{dialogsTranslations("changeCover.trigger")}
					</ContextMenuItem>
					<ContextMenuItem onClick={() => setOpenShare(true)}>
						{dialogsTranslations("share.trigger")}
					</ContextMenuItem>
					<ContextMenuItem disabled={folder.files.length === 0} asChild>
						<a href={`/api/folders/${folder.id}/download`} download>
							{t("actions.download")}
						</a>
					</ContextMenuItem>
					<ContextMenuItem onClick={() => setOpenProperties(true)}>
						{t("actions.properties")}
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						onClick={() => setOpenDelete(true)}
						className="text-red-600 focus:text-red-600 font-semibold"
					>
						{dialogsTranslations("delete.trigger")}
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<RenameFolderDialog
				folderId={folder.id}
				folderName={folder.name}
				openState={openRename}
				setOpenState={setOpenRename}
			/>
			<ChangeCoverFolderDialog
				images={folder.files.filter(file => file.type === FileType.IMAGE)}
				folderId={folder.id}
				open={openChangeCover}
				setOpen={setOpenChangeCover}
			/>
			<ShareFolderDialog folder={folder} open={openShare} setOpen={setOpenShare} />
			<FolderPropertiesDialog folder={folder} open={openProperties} setOpen={setOpenProperties} />
			<DeleteFolderDialog
				folderId={folder.id}
				folderName={folder.name}
				openState={openDelete}
				setOpenState={setOpenDelete}
			/>
		</>
	);
}
