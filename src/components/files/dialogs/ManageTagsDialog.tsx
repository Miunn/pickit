import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { BrushCleaning, Loader2 } from "lucide-react";
import { PopoverContent, PopoverNonPortal, PopoverTrigger } from "../../ui/popover-non-portal";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { useState } from "react";
import { createTag } from "@/actions/tags";
import { toast } from "sonner";
import { FolderTag } from "@prisma/client";
import TagChip from "../../tags/TagChip";
import { cn } from "@/lib/utils";
import { useFolderContext } from "@/context/FolderContext";

const colors = ["#00a8ff", "#9c88ff", "#487eb0", "#e84118", "#273c75", "#44bd32", "#e67e22", "#1abc9c", "#f1c40f"];

interface AddTagPopoverProps {
    onTagAdded: (tag: FolderTag) => void;
    folderId: string;
}

const AddTagPopover = ({ onTagAdded, folderId }: AddTagPopoverProps) => {
    const t = useTranslations("dialogs.files.addTag");
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState(colors[0]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleAdd = async () => {
        if (name.length === 0) {
            toast.error(t("addTag.errorEmpty"));
            return;
        }

        setLoading(true);
        const result = await createTag(name, selectedColor, folderId);
        setLoading(false);

        if (result.success) {
            setName("");
            toast.success(t("addTag.success"));
            onTagAdded(result.tag);
            setOpen(false);
            return;
        }

        toast.error(t("addTag.errorAdd"));
    };

    return (
        <PopoverNonPortal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="underline cursor-pointer">{t("addTag.addFirst")}</button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-2">
                <Label>{t("addTag.name")}</Label>
                <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === " ") {
                            e.stopPropagation();
                        }
                    }}
                />

                <div className="w-full">
                    <Label>{t("addTag.color")}</Label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                        {colors.map(color => (
                            <button
                                key={color}
                                className={cn(
                                    "h-9 rounded-md cursor-pointer transition-all duration-75 ease-in-out outline outline-0 outline-offset-0 outline-transparent",
                                    selectedColor === color && "outline outline-2 outline-offset-2 outline-primary"
                                )}
                                type="button"
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                            />
                        ))}
                    </div>
                </div>

                <Button onClick={handleAdd} disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null} {t("addTag.add")}
                </Button>
            </PopoverContent>
        </PopoverNonPortal>
    );
};

/**
 * Renders a dialog that lets users view, add, and toggle tags for a folder.
 *
 * The dialog shows currently selected tags and all tags available on the folder, allows adding new tags (which updates folder context and local state), and invokes provided callbacks when a tag is selected, unselected, or newly added.
 *
 * @param children - Trigger element to open the dialog.
 * @param selectedTags - The initial list of tags considered selected when the dialog opens.
 * @param onTagSelected - Called when a tag is selected; should return `true` on success, `false` to revert the selection in the UI.
 * @param onTagUnselected - Called when a tag is unselected; should return `true` on success, `false` to revert the unselection in the UI.
 * @param onTagAdded - Called after a new tag is created; invoked with the created tag. The component updates folder context and local state regardless of the callback's result.
 * @param className - Optional CSS class applied to the dialog trigger.
 * @returns The ManageTagsDialog React element.
 */
export default function ManageTagsDialog({
    children,
    selectedTags,
    onTagSelected,
    onTagUnselected,
    onTagAdded,
    className,
    ...props
}: {
    children: React.ReactNode;
    selectedTags: FolderTag[];
    onTagSelected: (tag: FolderTag) => Promise<boolean>;
    onTagUnselected: (tag: FolderTag) => Promise<boolean>;
    onTagAdded: (tag: FolderTag) => Promise<boolean>;
    className?: string;
} & React.ComponentProps<typeof DialogTrigger>) {
    const t = useTranslations("dialogs.files.addTag");
    const [selectedTagsState, setSelectedTags] = useState<FolderTag[]>(selectedTags);
    const { folder, setFolder } = useFolderContext();

    const handleTagAdded = async (tag: FolderTag) => {
        setFolder(prev => ({ ...prev, tags: [...prev.tags, tag] }));
        setSelectedTags(prev => [...prev, tag]);

        if (!onTagAdded) return;

        const r = await onTagAdded(tag);

        if (!r) {
            setFolder(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== tag.id) }));
            setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
        }
    };

    const handleTagSelected = async (tag: FolderTag) => {
        setSelectedTags([...selectedTags, tag]);

        const result = await onTagSelected(tag);
        if (!result) {
            setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
        }
    };

    const handleTagUnselected = async (tag: FolderTag) => {
        setSelectedTags(selectedTags.filter(t => t.id !== tag.id));

        const result = await onTagUnselected(tag);
        if (!result) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <Dialog>
            <DialogTrigger className={className} {...props} asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <Label>
                        {t("selectedTags")}{" "}
                        <span className="text-sm text-muted-foreground">
                            <AddTagPopover onTagAdded={handleTagAdded} folderId={folder.id} />
                        </span>
                    </Label>

                    {selectedTagsState.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedTagsState.map(tag => (
                                <TagChip
                                    key={tag.id}
                                    tag={tag}
                                    checked={true}
                                    showCheckbox
                                    onTagSelected={handleTagSelected}
                                    onTagUnselected={handleTagUnselected}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="flex items-center gap-2 my-[3px] text-muted-foreground text-sm">
                            <BrushCleaning /> {t("noSelectedTags")}
                        </p>
                    )}
                </div>

                <div className="grid gap-4">
                    <Label>
                        {t("folderTags")}{" "}
                        <span className="text-sm text-muted-foreground">
                            <AddTagPopover onTagAdded={handleTagAdded} folderId={folder.id} />
                        </span>
                    </Label>
                    {folder.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {folder.tags.map(tag => (
                                <TagChip
                                    key={tag.id}
                                    tag={tag}
                                    checked={selectedTagsState.some(t => t.id === tag.id)}
                                    showCheckbox
                                    onTagSelected={handleTagSelected}
                                    onTagUnselected={handleTagUnselected}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="flex items-center gap-2 my-[3px] text-muted-foreground text-sm">
                            <BrushCleaning /> {t("noFolderTags")}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
