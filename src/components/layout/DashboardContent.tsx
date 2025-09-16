"use client";

import { FolderX } from "lucide-react";
import FolderPreviewGrid from "@/components/folders/FolderPreviewGrid";
import { useTranslations } from "next-intl";
import React from "react";
import { LastUploadedImages } from "@/components/files/LastUploadedImages";
import {
  FileWithComments,
  FileWithTags,
  FolderWithAccessToken,
  FolderWithCover,
  FolderWithFilesCount,
  FolderWithFilesWithFolderAndComments,
  FolderWithTags,
} from "@/lib/definitions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import CreateFolderDialog from "../folders/CreateFolderDialog";

export default function DashboardContent({
  lastFolders,
}: {
  lastFolders: (FolderWithAccessToken &
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
          <h2 className={"font-semibold mb-5"}>
            {t("folders.lastUpdatedFolders")}
          </h2>

          <div
            className={`grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] gap-3 ${lastFolders.length == 0 && "justify-center"} mb-10`}
          >
            {lastFolders.length == 0 ? (
              <div
                className={
                  "col-span-full flex flex-col justify-center items-center"
                }
              >
                <FolderX className={"w-32 h-32 opacity-20"} />
                <p>{t("folders.empty")}</p>
              </div>
            ) : (
              lastFolders.map((folder) => (
                <FolderPreviewGrid key={folder.id} folder={folder} />
              ))
            )}
          </div>

          <LastUploadedImages />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setOpenCreateFolder(true)}>
            {t("contextMenu.createFolder")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <CreateFolderDialog
        open={openCreateFolder}
        setOpen={setOpenCreateFolder}
      />
    </>
  );
}
