import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import { FolderTag } from "@prisma/client";
import { Tag, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import ManageTagsDialog from "../../dialogs/ManageTagsDialog";
import { ContextFile, useFilesContext } from "@/context/FilesContext";
import { addTagsToFiles, removeTagsFromFiles } from "@/actions/tags";
import { toast } from "sonner";
import { DeleteMultipleImagesDialog } from "../../dialogs/DeleteMultipleImagesDialog";
import { useEffect, useRef, useState } from "react";

/**
 * UI bar that appears when files are selected, showing selection count, total size, and actions for tag management and deletion.
 *
 * @param selected - Array of selected file IDs.
 * @param sizeSelected - Total size in bytes of the selected files.
 * @param onClose - Callback invoked to close the selecting bar.
 * @returns A React element rendering the sticky selecting bar with controls to manage tags and delete selected files.
 */
export default function SelectingBar({
    selected,
    sizeSelected,
    onClose,
}: {
    readonly selected: string[];
    readonly sizeSelected: number;
    readonly onClose: () => void;
}) {
    const t = useTranslations("files.grid.selectingBar");

    const { setFiles } = useFilesContext();
    const stickyRef = useRef<HTMLDivElement>(null);
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        // Detect when div gets sticky
        const current = stickyRef.current;
        const observer = new IntersectionObserver(([e]) => setIsSticky(e.intersectionRatio < 1), { threshold: [1] });
        if (current) {
            observer.observe(current);
        }

        return () => {
            if (current) {
                observer.unobserve(current);
            }
        };
    }, [stickyRef]);

    const handleTagAdded = async (tag: FolderTag) => {
        setFiles((prev: ContextFile[]) =>
            prev.map(f => (selected.includes(f.id) ? { ...f, tags: [...f.tags, tag] } : f))
        );

        return true;
    };

    const handleTagSelected = async (tag: FolderTag) => {
        setFiles((prev: ContextFile[]) => {
            return prev.map(f => (selected.includes(f.id) ? { ...f, tags: [...f.tags, tag] } : f));
        });
        const result = await addTagsToFiles(selected, [tag.id]);
        if (!result.success) {
            toast.error(t("addTag.errorAdd"));

            setFiles((prev: ContextFile[]) => {
                return prev.map(f =>
                    selected.includes(f.id) ? { ...f, tags: f.tags.filter(t => t.id !== tag.id) } : f
                );
            });
        }

        return result.success;
    };

    const handleTagUnselected = async (tag: FolderTag) => {
        setFiles(prev =>
            prev.map(f => (selected.includes(f.id) ? { ...f, tags: f.tags.filter(t => t.id !== tag.id) } : f))
        );
        const result = await removeTagsFromFiles(selected, [tag.id]);
        if (!result.success) {
            toast.error(t("addTag.errorRemove"));
            setFiles(prev => prev.map(f => (selected.includes(f.id) ? { ...f, tags: [...f.tags, tag] } : f)));
        }

        return result.success;
    };

    return (
        <div
            ref={stickyRef}
            className={cn(
                "sticky -top-px z-20 flex justify-between items-center mb-5 dark:bg-primary/30 rounded-2xl w-full p-2",
                isSticky ? "bg-background rounded-t-none" : "bg-gray-50"
            )}
        >
            <div className={"flex gap-2 items-center"}>
                <Button variant="ghost" onClick={onClose} size="icon">
                    <X className={"w-4 h-4"} />
                </Button>
                <h2>
                    <span className={"font-semibold"}>{t("selected", { count: selected.length })}</span> -{" "}
                    {formatBytes(sizeSelected, { decimals: 2, sizeType: "normal" })}
                </h2>
            </div>

            <div className="space-x-2">
                <ManageTagsDialog
                    selectedTags={[]}
                    onTagAdded={handleTagAdded}
                    onTagSelected={handleTagSelected}
                    onTagUnselected={handleTagUnselected}
                >
                    <Button variant={"outline"}>
                        <Tag className="mr-2" /> {t("manageTags")}
                    </Button>
                </ManageTagsDialog>
                <DeleteMultipleImagesDialog fileIds={selected} onDelete={onClose}>
                    <Button variant="outline">
                        <Trash2 className={"mr-2"} /> {t("delete")}
                    </Button>
                </DeleteMultipleImagesDialog>
            </div>
        </div>
    );
}
