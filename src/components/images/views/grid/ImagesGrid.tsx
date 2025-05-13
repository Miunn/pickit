'use client'

import { ImagePreviewGrid } from "@/components/images/views/grid/ImagePreviewGrid";
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash2, X, Pencil } from "lucide-react";
import { DeleteMultipleImagesDialog } from "@/components/images/DeleteMultipleImagesDialog";
import { CarouselDialog } from "@/components/images/carousel/CarouselDialog";
import { FileWithComments, FileWithFolder } from "@/lib/definitions";
import { cn, formatBytes, getSortedImagesVideosContent } from "@/lib/utils";
import { UploadImagesForm } from "@/components/images/upload/UploadImagesForm";
import { useSession } from "@/providers/SessionProvider";
import { closestCenter, DndContext, DragEndEvent, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { updateFilePosition } from "@/actions/files";
import { useFolderContext } from "@/context/FolderContext";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import EditDescriptionDialog from "@/components/folders/EditDescriptionDialog";
import DeleteDescriptionDialog from "@/components/folders/DeleteDescriptionDialog";
import { useFilesContext } from "@/context/FilesContext";
export const ImagesGrid = ({ sortState }: { sortState: ImagesSortMethod }) => {
    const { user } = useSession();
    const { folder } = useFolderContext();
    const { files, setFiles } = useFilesContext();

    const t = useTranslations("images");
    const deleteMultipleTranslations = useTranslations("dialogs.images.deleteMultiple");
    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [startIndex, setStartIndex] = useState(0);

    const [selecting, setSelecting] = useState<boolean>(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [sizeSelected, setSizeSelected] = useState<number>(0);

    const scrollableContainerRef = useRef<HTMLDivElement>(null);

    const [activeId, setActiveId] = useState(null);

    const [sortStrategy, setSortStrategy] = useState<ImagesSortMethod | 'dragOrder'>(sortState);

    const getSortedFiles = useCallback((files: (FileWithFolder & FileWithComments)[]) => {
        if (sortStrategy !== 'dragOrder') {
            const sortedItems = [...getSortedImagesVideosContent(files, sortState)] as (FileWithFolder & FileWithComments)[];
            return sortedItems;
        }


        const orderedItems = [...files];
        const sortedItems = [...orderedItems].sort((a, b) => {
            const aIndex = files.findIndex((file) => file.id === a.id);
            const bIndex = files.findIndex((file) => file.id === b.id);
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
        return sortedItems;
    }, [sortState, sortStrategy]);

    const defaultSortedFiles = useMemo(() => getSortedFiles(files), [getSortedFiles]);

    const [sortedFiles, setSortedFiles] = useState<(FileWithFolder & FileWithComments)[]>(defaultSortedFiles);

    useEffect(() => {
        setSortStrategy(sortState);
        setSortedFiles(getSortedFiles(files));
    }, [sortState]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 90,
                tolerance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 90,
                tolerance: 5,
            },
        }),
    );

    useEffect(() => {
        if (selected.length === 0) {
            setSelecting(false);
            setSizeSelected(0);
        }
    }, [selected]);

    const handleDragStart = (event: any) => {
        const { active } = event;
        setActiveId(active.id);
    }

    const handleDragMove = (event: any) => {
        const { active } = event;
        const container = scrollableContainerRef.current;

        if (!container || !active) return;

        const containerRect = container.getBoundingClientRect();
        const draggedItem = document.querySelector(`[data-id="${active.id}"]`) as HTMLElement;

        if (!draggedItem) return;

        const itemRect = draggedItem.getBoundingClientRect();

        if (
            itemRect.left < containerRect.left ||
            itemRect.right > containerRect.right ||
            itemRect.top < containerRect.top ||
            itemRect.bottom > containerRect.bottom
        ) {
            draggedItem.style.transform = `translate(0px, 0px)`;
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) {
            setActiveId(null);
            return;
        };

        const activeIndex = sortedFiles.findIndex((file) => file.id === activeId);
        const overIndex = sortedFiles.findIndex((file) => file.id === overId);

        setTimeout(async () => {
            let newPosition: number | undefined;
            console.log("Files positions:", files.map((file) => ({ name: file.name, position: file.position, id: file.id })));
            if (overIndex === 0) {
                // We just dragged to the first position
                console.log("Dragging to the first position", activeId, sortedFiles[0].id);
                newPosition = (await updateFilePosition(activeId, undefined, sortedFiles[0].id)).newPosition;
            } else if (overIndex === sortedFiles.length - 1) {
                // We just dragged to the last position
                console.log("Dragging to the last position", activeId, sortedFiles[sortedFiles.length - 1].id);
                newPosition = (await updateFilePosition(activeId, sortedFiles[sortedFiles.length - 2].id, undefined)).newPosition;
            } else {
                // We just dragged to the middle
                // Depending on the direction, we need to update the position of the file
                if (activeIndex < overIndex) {
                    newPosition = (await updateFilePosition(activeId, sortedFiles[overIndex].id, sortedFiles[overIndex + 1].id)).newPosition;
                } else {
                    newPosition = (await updateFilePosition(activeId, sortedFiles[overIndex - 1].id, sortedFiles[overIndex].id)).newPosition;
                }
            }

            if (newPosition) {
                console.log("New position:", newPosition);
                console.log("New files order:", files.map((file) => file.id === activeId ? { ...file, position: newPosition } : file).map((file) => file.name));
                setFiles(files.map((file) => file.id === activeId ? { ...file, position: newPosition } : file));
            }
        }, 0);

        setSortedFiles((currentOrder) => {
            const oldIndex = currentOrder.findIndex((file) => file.id === activeId);
            const newIndex = currentOrder.findIndex((file) => file.id === overId);

            if (oldIndex === -1) {
                // If item wasn't in the order, add it at the new position
                const newOrder = [...currentOrder];
                newOrder.splice(newIndex, 0, currentOrder.find((file) => file.id === activeId)!);
                return newOrder;
            }

            setSortStrategy('dragOrder');
            const orderedFiles = arrayMove(currentOrder, oldIndex, newIndex);

            console.log("Ordered IDs:", orderedFiles);

            return orderedFiles;
        });

        setActiveId(null);
    }

    const renderGrid = (): React.ReactNode => {
        if (user?.id === folder.createdById) {
            return (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragMove={handleDragMove}>
                    <SortableContext items={sortedFiles.map((item) => item.id)}>
                        {files.length === 0
                            ? <div className={"col-start-1 col-end-3 xl:col-start-2 xl:col-end-4 2xl:col-start-3 2xl:col-end-5 mx-auto mt-6 flex flex-col justify-center items-center max-w-lg"}>
                                <UploadImagesForm folderId={folder.id} />
                            </div>
                            : sortedFiles.map((file: FileWithFolder & FileWithComments) => (
                                <Fragment key={file.id}>
                                    <ImagePreviewGrid
                                        className={`${activeId === file.id ? "opacity-50" : ""}`}
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
                    </SortableContext>
                    <DragOverlay>
                        {activeId
                            ? <ImagePreviewGrid
                                file={sortedFiles.find((item) => item.id === activeId)!}
                                selected={selected}
                                onClick={() => { }}
                                onSelect={() => { }}
                            />
                            : null
                        }
                    </DragOverlay>
                </DndContext>
            )
        }

        return (
            sortedFiles.map((file: FileWithFolder & FileWithComments) => (
                <Fragment key={file.id}>
                    <ImagePreviewGrid
                        className={`${activeId === file.id ? "opacity-50" : ""}`}
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
            ))
        )
    }

    return (
        <div className="mt-10">
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
            {folder.description
                ? <div className={cn("block sm:hidden w-full col-span-1 sm:col-span-1 lg:max-w-64 max-h-[200px] relative group overflow-auto mb-3",
                    "border border-primary rounded-lg p-4"
                )}>
                    <p className={"text-sm text-muted-foreground whitespace-pre-wrap"}>{folder.description}</p>
                    {folder.createdById === user?.id
                        ? <div className="flex sm:flex-col gap-2 absolute top-2 right-2 group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                            <EditDescriptionDialog folder={folder}>
                                <Button variant="ghost" size="icon"><Pencil className={"w-4 h-4"} /></Button>
                            </EditDescriptionDialog>
                            <DeleteDescriptionDialog folder={folder}>
                                <Button variant="ghost" size="icon"><Trash2 className={"w-4 h-4"} /></Button>
                            </DeleteDescriptionDialog>
                        </div>
                        : null
                    }
                </div>
                : null
            }
            <div className={cn(
                files.length === 0 ? "flex flex-col lg:flex-row justify-center" : "grid grid-cols-[repeat(auto-fill,10rem)] sm:grid-cols-[repeat(auto-fill,16rem)] gap-3 sm:gap-3 mx-auto",
                "relative overflow-hidden"
            )}>
                {folder.description
                    ? <div className={cn("hidden sm:block w-full col-span-1 sm:col-span-1 lg:max-w-64 max-h-[200px] relative group overflow-auto",
                        "border border-primary rounded-lg p-4"
                    )}>
                        <p className={"text-sm text-muted-foreground whitespace-pre-wrap"}>{folder.description}</p>
                        {folder.createdById === user?.id
                            ? <div className="flex sm:flex-col gap-2 absolute top-2 right-2 group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                                <EditDescriptionDialog folder={folder}>
                                    <Button variant="ghost" size="icon"><Pencil className={"w-4 h-4"} /></Button>
                                </EditDescriptionDialog>
                                <DeleteDescriptionDialog folder={folder}>
                                    <Button variant="ghost" size="icon"><Trash2 className={"w-4 h-4"} /></Button>
                                </DeleteDescriptionDialog>
                            </div>
                            : null
                        }
                    </div>
                    : null
                }
                {renderGrid()}
            </div>

            <CarouselDialog title={folder.name} carouselOpen={carouselOpen} setCarouselOpen={setCarouselOpen} startIndex={startIndex} />
            <DeleteMultipleImagesDialog files={files.filter((file) => selected.includes(file.id))} open={openDeleteMultiple} setOpen={setOpenDeleteMultiple} onDelete={() => {
                setSelected([]);
                setSelecting(false);
            }} />
        </div>
    )
}
