"use client";

import { ImagePreviewGrid } from "@/components/files/views/grid/ImagePreviewGrid";
import React, { useEffect, useRef, useState } from "react";
import { DeleteMultipleImagesDialog } from "@/components/files/dialogs/DeleteMultipleImagesDialog";
import { CarouselDialog } from "@/components/files/carousel/CarouselDialog";
import { cn } from "@/lib/utils";
import { UploadImagesForm } from "@/components/files/upload/UploadImagesForm";
import { useSession } from "@/providers/SessionProvider";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragMoveEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    TouchSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { updateFilePosition } from "@/actions/files";
import { useFolderContext } from "@/context/FolderContext";
import { useFilesContext } from "@/context/FilesContext";
import SelectingBar from "./SelectingBar";
import FolderDescription from "@/components/folders/views/grid/FolderDescription";
import RecentlyAdded from "./RecentlyAdded";

export const ImagesGrid = () => {
    const { user } = useSession();
    const { folder, isShared /*token, tokenHash*/ } = useFolderContext();
    const { files, setFiles, sortedFiles } = useFilesContext();

    const [carouselOpen, setCarouselOpen] = useState<boolean>(false);
    const [openDeleteMultiple, setOpenDeleteMultiple] = useState<boolean>(false);
    const [startIndex, setStartIndex] = useState(0);
    const [selecting, setSelecting] = useState<boolean>(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [sizeSelected, setSizeSelected] = useState<number>(0);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    const scrollableContainerRef = useRef<HTMLDivElement>(null);
    const hashProcessedRef = useRef<boolean>(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 500,
                tolerance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 500,
                tolerance: 5,
            },
        })
    );

    useEffect(() => {
        if (selected.length === 0) {
            setSelecting(false);
            setSizeSelected(0);
        }
    }, [selected]);

    // Look for URL hash to open carousel at specific image
    useEffect(() => {
        if (hashProcessedRef.current) return;

        const hash = window.location.hash;
        if (hash === "") return;

        const fileIdFromHash = hash.substring(1); // Remove the '#' character

        const scrollToElement = (attempts = 0) => {
            const element = document.getElementById(fileIdFromHash);

            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                element.focus();

                // Mark as processed and clean up hash immediately
                hashProcessedRef.current = true;
                if (window.location.hash === `#${fileIdFromHash}`) {
                    history.replaceState("", document.title, window.location.pathname + window.location.search);
                }
                return;
            }

            // Retry up to 10 times with 100ms intervals
            if (attempts < 10) {
                setTimeout(() => scrollToElement(attempts + 1), 100);
            }
        };

        scrollToElement();

        return () => {
            hashProcessedRef.current = false;
        };
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id);
    };

    const handleDragMove = (event: DragMoveEvent) => {
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
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) {
            setActiveId(null);
            return;
        }

        const activeIndex = sortedFiles.findIndex(file => file.id === activeId);
        const overIndex = sortedFiles.findIndex(file => file.id === overId);

        setTimeout(async () => {
            let newPosition: number | undefined;
            if (overIndex === 0) {
                // We just dragged to the first position
                newPosition = (await updateFilePosition(activeId, undefined, sortedFiles[0].id)).newPosition;
            } else if (overIndex === sortedFiles.length - 1) {
                // We just dragged to the last position
                newPosition = (await updateFilePosition(activeId, sortedFiles[sortedFiles.length - 2].id, undefined))
                    .newPosition;
            } else {
                // We just dragged to the middle
                // Depending on the direction, we need to update the position of the file
                if (activeIndex < overIndex) {
                    newPosition = (
                        await updateFilePosition(activeId, sortedFiles[overIndex].id, sortedFiles[overIndex + 1].id)
                    ).newPosition;
                } else {
                    newPosition = (
                        await updateFilePosition(activeId, sortedFiles[overIndex - 1].id, sortedFiles[overIndex].id)
                    ).newPosition;
                }
            }

            if (newPosition) {
                const updatedFiles = files.map(file =>
                    file.id === activeId ? { ...file, position: newPosition } : file
                );
                setFiles(updatedFiles);
            }
        }, 0);

        setActiveId(null);
    };

    const handleClickImage = (fileId: string, idx: number, event?: React.MouseEvent) => {
        if (!selecting) {
            setStartIndex(idx);
            setCarouselOpen(true);
            return;
        }

        const file = sortedFiles.find(item => item.id === fileId);
        if (!file) return;

        if (event?.shiftKey && selected.length > 0) {
            const lastSelectedId = selected[selected.length - 1];
            const lastSelectedIndex = sortedFiles.findIndex(item => item.id === lastSelectedId);
            const currentIndex = sortedFiles.findIndex(item => item.id === file.id);

            if (lastSelectedIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastSelectedIndex, currentIndex);
                const end = Math.max(lastSelectedIndex, currentIndex);
                const range = sortedFiles.slice(start, end + 1);

                const newSelectedIds = range.map(item => item.id);
                const uniqueNewIds = newSelectedIds.filter(id => !selected.includes(id));
                const newlySelected = range.filter(item => !selected.includes(item.id));
                const newSize = newlySelected.reduce((acc, item) => acc + item.size, 0);

                setSelected([...selected, ...uniqueNewIds]);
                setSizeSelected(sizeSelected + newSize);
            }
        } else if (selected.includes(file.id)) {
            setSelected(selected.filter(id => id !== file.id));
            setSizeSelected(sizeSelected - file.size);
        } else {
            setSelected([...selected, file.id]);
            setSizeSelected(sizeSelected + file.size);
        }
    };

    const handleSelectFile = (id: string, size: number) => {
        setSelecting(true);
        if (selected.includes(id)) {
            setSelected(selected.filter(selectedId => selectedId !== id));
            setSizeSelected(sizeSelected - size);
        } else {
            setSelected([...selected, id]);
            setSizeSelected(sizeSelected + size);
        }
    };

    const renderGrid = (): React.ReactNode => {
        if (user?.id === folder.createdById) {
            return (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragMove={handleDragMove}
                >
                    <SortableContext items={sortedFiles.map(item => item.id)}>
                        {sortedFiles.length === 0 ? (
                            <div
                                className={
                                    "col-start-1 col-end-3 xl:col-start-2 xl:col-end-4 2xl:col-start-3 2xl:col-end-5 mx-auto mt-6 flex flex-col justify-center items-center max-w-lg"
                                }
                            >
                                <UploadImagesForm
                                    folderId={folder.id}
                                    shouldDisplayNotify={isShared}
                                    onUpload={uploadedFiles => {
                                        const newFiles = [...files, ...uploadedFiles];
                                        setFiles(newFiles);
                                    }}
                                />
                            </div>
                        ) : (
                            sortedFiles.map((file, idx) => (
                                <ImagePreviewGrid
                                    key={file.id}
                                    id={file.id}
                                    data-id={file.id}
                                    className={cn(
                                        activeId === file.id && "opacity-50",
                                        "focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background rounded-xl"
                                    )}
                                    file={file}
                                    selected={selected}
                                    onClick={e => handleClickImage(file.id, idx, e)}
                                    onSelect={() => handleSelectFile(file.id, file.size)}
                                />
                            ))
                        )}
                    </SortableContext>
                    <DragOverlay>
                        {activeId ? (
                            <ImagePreviewGrid
                                file={sortedFiles.find(item => item.id === activeId)!}
                                selected={selected}
                                onClick={() => {}}
                                onSelect={() => {}}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            );
        }

        return sortedFiles.map((file, idx) => (
            <ImagePreviewGrid
                key={file.id}
                id={file.id}
                data-id={file.id}
                className={cn(
                    "focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background rounded-xl",
                    activeId === file.id && "opacity-50"
                )}
                file={file}
                selected={selected}
                onClick={e => handleClickImage(file.id, idx, e)}
                onSelect={() => handleSelectFile(file.id, file.size)}
            />
        ));
    };

    return (
        <div className="mt-10">
            <RecentlyAdded
                onClickImage={file => {
                    const index = sortedFiles.findIndex(f => f.id === file.id);
                    setStartIndex(Math.max(index, 0));
                    setCarouselOpen(true);
                }}
            />
            {selecting ? (
                <SelectingBar
                    selected={selected}
                    sizeSelected={sizeSelected}
                    onClose={() => {
                        setSelected([]);
                        setSizeSelected(0);
                    }}
                />
            ) : null}
            <FolderDescription className="block sm:hidden w-full col-span-1 sm:col-span-1 lg:max-w-64 max-h-[200px] mb-3" />
            <div
                className={cn(
                    files.length === 0
                        ? "flex flex-col lg:flex-row justify-center"
                        : "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] justify-items-start gap-3 sm:gap-3 mx-auto",
                    "relative"
                )}
            >
                <FolderDescription className="hidden sm:block w-full col-span-1 sm:col-span-1 lg:max-w-64 max-h-[200px]" />
                {renderGrid()}
            </div>

            <CarouselDialog
                title={folder.name}
                carouselOpen={carouselOpen}
                setCarouselOpen={setCarouselOpen}
                startIndex={startIndex}
            />
            <DeleteMultipleImagesDialog
                fileIds={files.filter(file => selected.includes(file.id)).map(file => file.id)}
                open={openDeleteMultiple}
                setOpen={setOpenDeleteMultiple}
                onDelete={() => {
                    setSelected([]);
                    setSelecting(false);
                }}
            />
        </div>
    );
};
