"use client";

import { useTranslations } from "next-intl";
import React from "react";
import { FileWithTags, FolderWithTags } from "@/lib/definitions";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { changeFolderCover } from "@/actions/folders";
import { useSession } from "@/providers/SessionProvider";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileType, FolderTag } from "@prisma/client";
import RenameImageDialog from "../../dialogs/RenameImageDialog";
import { DeleteImageDialog } from "../../dialogs/DeleteImageDialog";
import ImagePropertiesDialog from "../../dialogs/ImagePropertiesDialog";
import ManageTagsDialog from "../../dialogs/ManageTagsDialog";
import { ContextFile, useFilesContext } from "@/context/FilesContext";
import { addTagsToFile, removeTagsFromFile } from "@/actions/tags";
import { toast as sonnerToast } from "sonner";
import { useSearchParams } from "next/navigation";
import FileThumbnail from "./FileThumbnail";

export type ImagePreviewProps = {
    file: { folder: FolderWithTags } & FileWithTags;
    selected: string[];
    onClick: (e?: React.MouseEvent) => void;
    onSelect: () => void;
    className?: string;
} & React.HTMLAttributes<HTMLButtonElement>;

export const ImagePreviewGrid = ({ file, selected, onClick, onSelect, className, ...props }: ImagePreviewProps) => {
    const t = useTranslations("images");
    const deleteTranslations = useTranslations("dialogs.images.delete");
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t");

    const [openRename, setOpenRename] = React.useState(false);
    const [openProperties, setOpenProperties] = React.useState(false);
    const [openDelete, setOpenDelete] = React.useState(false);

    const { user } = useSession();
    const { setFiles } = useFilesContext();

    const { attributes, listeners, setNodeRef, transition, transform } = useSortable({ id: file.id });

    const style =
        file.createdById === user?.id && transform
            ? {
                  transform: CSS.Translate.toString(transform),
                  transition,
              }
            : undefined;

    const handleTagSelected = async (tag: FolderTag) => {
        setFiles((prev: ContextFile[]) => {
            return prev.map(f => (f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f));
        });
        const result = await addTagsToFile(file.id, [tag.id]);
        if (!result.success) {
            sonnerToast.error(t("addTag.errorAdd"));

            setFiles((prev: ContextFile[]) => {
                return prev.map(f =>
                    f.id === file.id
                        ? {
                              ...f,
                              tags: f.tags.filter(t => t.id !== tag.id),
                          }
                        : f
                );
            });
        }

        return result.success;
    };

    return (
        <>
            <ContextMenu key={file.id} modal={false}>
                <ContextMenuTrigger asChild>
                    <button
                        ref={setNodeRef}
                        onClick={onClick}
                        className={cn(
                            "w-full cursor-pointer",
                            "focus:ring focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:outline-none rounded-xl",
                            className
                        )}
                        style={style}
                        {...listeners}
                        {...attributes}
                        {...props}
                    >
                        <div
                            className={cn(
                                `inline-block w-full rounded-2xl ${selected.includes(file.id) ? "bg-accent" : ""}`
                            )}
                        >
                            <div className={`${selected.includes(file.id) ? "scale-95" : ""}`}>
                                <FileThumbnail file={file} />
                            </div>
                        </div>
                    </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={onClick}>{t("actions.view")}</ContextMenuItem>
                    {file.createdById === user?.id ? (
                        <ContextMenuItem onClick={onSelect}>{t("actions.select")}</ContextMenuItem>
                    ) : null}
                    <ContextMenuItem asChild>
                        <a
                            href={(() => {
                                const url = new URL(
                                    `/api/folders/${file.folderId}/${file.type === FileType.IMAGE ? "images" : "videos"}/${file.id}/download`,
                                    window.location.origin
                                );
                                if (shareToken) url.searchParams.set("share", shareToken);
                                if (shareHashPin) url.searchParams.set("h", shareHashPin);
                                if (tokenType) url.searchParams.set("t", tokenType);
                                return url.pathname + url.search;
                            })()}
                        >
                            {t("actions.download")}
                        </a>
                    </ContextMenuItem>
                    {file.createdById === user?.id ? (
                        <ContextMenuItem onClick={e => e.preventDefault()}>
                            <ManageTagsDialog
                                selectedTags={file.tags}
                                onTagAdded={handleTagSelected}
                                onTagSelected={handleTagSelected}
                                onTagUnselected={async (tag: FolderTag) => {
                                    setFiles(prev =>
                                        prev.map(f =>
                                            f.id === file.id ? { ...f, tags: f.tags.filter(t => t.id !== tag.id) } : f
                                        )
                                    );
                                    const result = await removeTagsFromFile(file.id, [tag.id]);
                                    if (!result.success) {
                                        sonnerToast.error(t("addTag.errorRemove"));
                                        setFiles(prev =>
                                            prev.map(f => (f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f))
                                        );
                                    }

                                    return result.success;
                                }}
                            >
                                <span>{t("actions.addTag")}</span>
                            </ManageTagsDialog>
                        </ContextMenuItem>
                    ) : null}
                    {file.createdById === user?.id ? (
                        <ContextMenuItem onClick={() => setOpenRename(true)}>{t("actions.rename")}</ContextMenuItem>
                    ) : null}
                    {file.type === FileType.IMAGE && file.createdById === user?.id ? (
                        <ContextMenuItem
                            onClick={async () => {
                                const r = await changeFolderCover(file.folderId, file.id);

                                if (r.error) {
                                    toast({
                                        title: t("actions.setAsCover.errors.unknown.title"),
                                        description: t("actions.setAsCover.errors.unknown.description"),
                                        variant: "destructive",
                                    });
                                    return;
                                }

                                toast({
                                    title: t("actions.setAsCover.success.title"),
                                    description: t("actions.setAsCover.success.description"),
                                });
                            }}
                        >
                            {t("actions.setAsCover.label")}
                        </ContextMenuItem>
                    ) : null}
                    <ContextMenuItem onClick={() => setOpenProperties(true)}>{t("actions.properties")}</ContextMenuItem>
                    {file.createdById === user?.id ? (
                        <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                                onClick={() => setOpenDelete(true)}
                                className="text-red-600 focus:text-red-600 font-semibold"
                            >
                                {deleteTranslations("trigger")}
                            </ContextMenuItem>
                        </>
                    ) : null}
                </ContextMenuContent>
            </ContextMenu>
            <RenameImageDialog file={file} openState={openRename} setOpenState={setOpenRename} />
            <DeleteImageDialog file={file} open={openDelete} setOpen={setOpenDelete} />
            <ImagePropertiesDialog file={file} open={openProperties} setOpen={setOpenProperties} />
        </>
    );
};
