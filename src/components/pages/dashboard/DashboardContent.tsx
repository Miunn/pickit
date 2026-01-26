"use client";

import { useTranslations } from "next-intl";
import React from "react";
import { LastUploadedImages } from "@/components/pages/dashboard/LastUploadedImages";
import {
	FileWithComments,
	FileWithTags,
	FolderWithAccessToken,
	FolderWithCover,
	FolderWithFilesCount,
	FolderWithLastSlug,
	FolderWithTags,
} from "@/lib/definitions";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../../ui/context-menu";
import CreateFolderDialog from "../../folders/dialogs/CreateFolderDialog";
import LastUpdatedFolders from "./LastUpdatedFolders";

export default function DashboardContent({
	lastFolders,
}: {
	readonly lastFolders: (FolderWithLastSlug &
		FolderWithAccessToken &
		FolderWithFilesCount &
		FolderWithCover & {
			files: ({ folder: FolderWithTags } & FileWithTags & FileWithComments)[];
		})[];
}) {
	const t = useTranslations("pages.dashboard");

	const [openCreateFolder, setOpenCreateFolder] = React.useState(false);

	return (
		<>
			<ContextMenu modal={false}>
				<ContextMenuTrigger className="flex flex-col flex-grow">
					<h2 className={"font-semibold mb-5"}>{t("folders.lastUpdatedFolders")}</h2>

					<LastUpdatedFolders folders={lastFolders} />

					<LastUploadedImages />
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={() => setOpenCreateFolder(true)}>
						{t("contextMenu.createFolder")}
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<CreateFolderDialog open={openCreateFolder} setOpen={setOpenCreateFolder} />
		</>
	);
}
