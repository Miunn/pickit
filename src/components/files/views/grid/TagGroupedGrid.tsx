import { ContextFile, useFilesContext } from "@/context/FilesContext";
import { Fragment, useMemo, useState } from "react";
import { ImagePreviewGrid } from "./ImagePreviewGrid";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { CarouselDialog } from "../../carousel/CarouselDialog";
import { DeleteMultipleImagesDialog } from "../../DeleteMultipleImagesDialog";
import { useFolderContext } from "@/context/FolderContext";
import { Separator } from "@/components/ui/separator";
import { FolderTag } from "@prisma/client";

export default function TagGroupedGrid() {
    const { folder } = useFolderContext();
    const { files } = useFilesContext();
    const t = useTranslations("images");
    const deleteMultipleTranslations = useTranslations("dialogs.images.deleteMultiple");

    const [selecting, setSelecting] = useState<boolean>(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [sizeSelected, setSizeSelected] = useState<number>(0);

    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [startIndex, setStartIndex] = useState(0);

    // Group files by tag with "No tags" group with all files that don't have any tags
    const groupedFiles = useMemo(() => {
        return files.reduce((acc, file) => {
            const fileTags = file.tags;
            fileTags.forEach((tag) => {
                const existingGroup = acc.find((group) => group.tag !== "No tags" && group.tag.id === tag.id);
                if (existingGroup) {
                    existingGroup.files.push(file);
                } else {
                    acc.push({ tag: tag, files: [file] });
                }
            });
            if (fileTags.length === 0) {
                const existingNoTagsGroup = acc.find((group) => group.tag === "No tags");
                if (existingNoTagsGroup) {
                    existingNoTagsGroup.files.push(file);
                } else {
                    acc.push({ tag: "No tags", files: [file] });
                }
            }
            return acc;
        }, [] as { tag: FolderTag | "No tags", files: ContextFile[] }[]).sort((a, b) => {
            if (a.tag === "No tags") return 1;
            if (b.tag === "No tags") return -1;
            return a.tag.name.localeCompare(b.tag.name);
        });
    }, [files]);

    const renderGroup = (tag: FolderTag | "No tags", files: ContextFile[]) => {
        const groupKey = tag !== "No tags" ? tag.id : "no-tags";
        const headerColor = tag !== "No tags" ? tag.color : "";
        const headerText = tag !== "No tags" ? tag.name : "No tags";

        return (
            <div>
                <h2 className="text-lg font-medium" style={{ color: headerColor }}>{headerText}</h2>
                <Separator orientation="horizontal" className="mt-2 mb-3" />
                <div key={groupKey} className={cn(
                    files.length === 0 ? "flex flex-col lg:flex-row justify-center" : "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] justify-items-start gap-3 sm:gap-3 mx-auto",
                    "relative overflow-hidden"
                )}>
                    {files.map((file) => (
                        <Fragment key={file.id}>
                            <ImagePreviewGrid
                                file={file}
                                selected={selected}
                                onClick={(e) => {
                                    if (selecting) {
                                        if (e?.shiftKey && selected.length > 0) {
                                            const lastSelectedId = selected[selected.length - 1];
                                            const lastSelectedIndex = files.findIndex((item) => item.id === lastSelectedId);
                                            const currentIndex = files.findIndex((item) => item.id === file.id);

                                            if (lastSelectedIndex !== -1 && currentIndex !== -1) {
                                                const start = Math.min(lastSelectedIndex, currentIndex);
                                                const end = Math.max(lastSelectedIndex, currentIndex);
                                                const range = files.slice(start, end + 1);

                                                const newSelectedIds = range.map((item) => item.id);
                                                const newSize = range.reduce((acc, item) => acc + item.size, 0);

                                                setSelected([...new Set([...selected, ...newSelectedIds])]);
                                                setSizeSelected(sizeSelected + newSize);
                                            }
                                        } else if (selected.includes(file.id)) {
                                            setSelected(selected.filter((id) => id !== file.id));
                                            setSizeSelected(sizeSelected - file.size);
                                        } else {
                                            setSelected([...selected, file.id]);
                                            setSizeSelected(sizeSelected + file.size);
                                        }
                                    } else {
                                        setStartIndex(files.indexOf(file));
                                        setCarouselOpen(true);
                                    }
                                }}
                                onSelect={() => {
                                    if (selected.includes(file.id)) {
                                        setSelected(selected.filter((id) => id !== file.id));
                                        setSizeSelected(sizeSelected - file.size);
                                    } else {
                                        setSelecting(true);
                                        setSelected([...selected, file.id]);
                                        setSizeSelected(sizeSelected + file.size);
                                    }
                                }}
                            />
                        </Fragment>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            {selecting
                ? <div className={"flex justify-between items-center mb-5 bg-gray-50 dark:bg-primary/30 rounded-2xl w-full p-2"}>
                    <div className={"flex gap-2 items-center"}>
                        <Button variant="ghost" onClick={() => {
                            setSelected([]);
                            setSizeSelected(0);
                            setSelecting(false);
                        }} size="icon"><X className={"w-4 h-4"} /></Button>
                        <h2><span className={"font-semibold"}>{t('selected', { count: selected.length })}</span> - {formatBytes(sizeSelected, { decimals: 2, sizeType: "normal" })}</h2>
                    </div>

                    <Button variant="outline" onClick={() => {
                        setOpenDeleteMultiple(true);
                    }}>
                        <Trash2 className={"mr-2"} /> {deleteMultipleTranslations('trigger')}
                    </Button>
                </div>
                : null
            }
            <div className="flex flex-col gap-6">
                {groupedFiles.map((group) => (
                    <Fragment key={group.tag !== "No tags" ? group.tag.id : "no-tags"}>
                        {renderGroup(group.tag, group.files)}
                    </Fragment>
                ))}
            </div>
            <CarouselDialog title={folder.name} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteMultipleImagesDialog files={files.filter((file) => selected.includes(file.id))} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple} onDelete={() => {
                setSelected([]);
                setSelecting(false);
            }} />
        </>
    )
}