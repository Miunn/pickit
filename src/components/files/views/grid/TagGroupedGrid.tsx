import { ContextFile, useFilesContext } from "@/context/FilesContext";
import { Fragment, useMemo, useState } from "react";
import { ImagePreviewGrid } from "./ImagePreviewGrid";
import { cn, groupFiles } from "@/lib/utils";
import { CarouselDialog } from "../../carousel/CarouselDialog";
import { DeleteMultipleImagesDialog } from "../../dialogs/DeleteMultipleImagesDialog";
import { useFolderContext } from "@/context/FolderContext";
import { FolderTag } from "@prisma/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SelectingBar from "./SelectingBar";

export default function TagGroupedGrid() {
    const { folder } = useFolderContext();
    const { files } = useFilesContext();

    const [selecting, setSelecting] = useState<boolean>(false);
    const [selected, setSelected] = useState<string[]>([]);
    const sizeSelected = useMemo(() => {
        return selected.reduce((acc, id) => {
            const file = files.find(f => f.id === id);
            return file ? acc + file.size : acc;
        }, 0);
    }, [selected, files]);

    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [startIndex, setStartIndex] = useState(0);

    // Group files by tag with "No tags" group with all files that don't have any tags
    const groupedFiles: { [key: string]: ContextFile[] } = useMemo(() => {
        return groupFiles(files);
    }, [files]);

    const handleClick = (file: ContextFile, e?: React.MouseEvent) => {
        if (selecting) {
            if (e?.shiftKey && selected.length > 0) {
                const lastSelectedId = selected[selected.length - 1];
                const lastSelectedIndex = files.findIndex(item => item.id === lastSelectedId);
                const currentIndex = files.findIndex(item => item.id === file.id);

                if (lastSelectedIndex !== -1 && currentIndex !== -1) {
                    const start = Math.min(lastSelectedIndex, currentIndex);
                    const end = Math.max(lastSelectedIndex, currentIndex);
                    const range = files.slice(start, end + 1);

                    const newSelectedIds = range.map(item => item.id);

                    setSelected([...new Set([...selected, ...newSelectedIds])]);
                }
            } else if (selected.includes(file.id)) {
                setSelected(selected.filter(id => id !== file.id));
            } else {
                setSelected([...selected, file.id]);
            }
        } else {
            setStartIndex(files.indexOf(file));
            setCarouselOpen(true);
        }
    };

    const handleSelect = (file: ContextFile) => {
        if (selected.includes(file.id)) {
            setSelected(selected.filter(id => id !== file.id));
        } else {
            setSelecting(true);
            setSelected([...selected, file.id]);
        }
    };

    const renderGroup = (tag: FolderTag | "no-tags", files: ContextFile[]) => {
        const groupKey = tag === "no-tags" ? "no-tags" : tag.id;
        const headerColor = tag === "no-tags" ? "" : tag.color;
        const headerText = tag === "no-tags" ? "No tags" : tag.name;

        return (
            <AccordionItem value={groupKey} className="prose:overflow-visible">
                <AccordionTrigger className="text-lg font-medium py-2">
                    <span style={{ color: headerColor }}>{headerText}</span>
                </AccordionTrigger>
                <AccordionContent
                    key={groupKey}
                    className={cn(
                        files.length === 0
                            ? "flex flex-col lg:flex-row justify-center"
                            : "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] justify-items-start gap-3 sm:gap-2 mx-auto",
                        "relative pt-3"
                    )}
                >
                    {files.map(file => (
                        <Fragment key={file.id}>
                            <ImagePreviewGrid
                                file={file}
                                selected={selected}
                                onClick={e => handleClick(file, e)}
                                onSelect={() => handleSelect(file)}
                            />
                        </Fragment>
                    ))}
                </AccordionContent>
            </AccordionItem>
        );
    };

    return (
        <>
            {selecting ? (
                <SelectingBar
                    selected={selected}
                    sizeSelected={sizeSelected}
                    onClose={() => {
                        setSelected([]);
                        setSelecting(false);
                    }}
                />
            ) : null}
            <Accordion type="multiple" defaultValue={Object.keys(groupedFiles)}>
                {Object.entries(groupedFiles).map(item => {
                    const [tagId, tagFiles] = item;
                    const tag = folder.tags.find(t => t.id === tagId);

                    if (!tag) return;

                    return <Fragment key={tagId}>{renderGroup(tag, tagFiles)}</Fragment>;
                })}
            </Accordion>
            <CarouselDialog
                title={folder.name}
                carouselOpen={carouselOpen}
                setCarouselOpen={setCarouselOpen}
                startIndex={startIndex}
            />
            <DeleteMultipleImagesDialog
                fileIds={selected}
                open={openDeleteMultiple}
                setOpen={setOpenDeleteMultiple}
                onDelete={() => {
                    setSelected([]);
                    setSelecting(false);
                }}
            />
        </>
    );
}
