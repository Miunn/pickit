import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { FileWithTags, FolderWithTags } from "@/lib/definitions";
import { Label } from "../ui/label";
import { BrushCleaning, Loader2 } from "lucide-react";
import { PopoverNonPortal, PopoverContent, PopoverTrigger } from "../ui/popover-non-portal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { addTagsToFile, createTag, removeTagsFromFile } from "@/actions/tags";
import { toast } from "sonner";
import { FolderTag } from "@prisma/client";
import TagChip from "../tags/TagChip";
import { useFilesContext } from "@/context/FilesContext";
import { cn } from "@/lib/utils";

const colors = [
    "#00a8ff",
    "#9c88ff",
    "#487eb0",
    "#e84118",
    "#273c75",
    "#44bd32",
    "#e67e22",
    "#1abc9c",
    "#f1c40f"
];

interface AddTagPopoverProps {
    onTagAdded: (tag: FolderTag) => void;
    folderId: string;
    fileId: string;
}

const AddTagPopover = ({ onTagAdded, folderId, fileId }: AddTagPopoverProps) => {
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
        const result = await createTag(name, selectedColor, folderId, fileId);
        setLoading(false);

        if (result.success) {
            setName("");
            toast.success(t("addTag.success"));
            onTagAdded(result.tag);
            setOpen(false);
        }
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
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === ' ') {
                            e.stopPropagation();
                        }
                    }}
                />

                <div className="w-full">
                    <Label>{t("addTag.color")}</Label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                        {colors.map((color) => (
                            <div key={color} className={cn("h-9 rounded-md cursor-pointer transition-all duration-75 ease-in-out outline outline-0 outline-offset-0 outline-transparent",
                                selectedColor === color && "outline outline-2 outline-offset-2 outline-primary"
                            )} style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} />
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

export default function ManageTagsDialog({ children, file, className, ...props }: { children: React.ReactNode, file: { folder: FolderWithTags } & FileWithTags, className?: string } & React.ComponentProps<typeof DialogTrigger>) {
    const t = useTranslations("dialogs.files.addTag");
    const [selectedTags, setSelectedTags] = useState<FolderTag[]>(file.tags);
    const [folderTags, setFolderTags] = useState<FolderTag[]>(file.folder.tags);
    const { files, setFiles } = useFilesContext();

    const handleTagAdded = (tag: FolderTag) => {
        setFolderTags([...folderTags, tag]);
        setSelectedTags([...selectedTags, tag]);
        setFiles(files.map((f) => f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f));
    };

    const handleTagSelected = async (tag: FolderTag) => {
        setSelectedTags([...selectedTags, tag]);
        setFiles(files.map((f) => f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f));
        const result = await addTagsToFile(file.id, [tag.id]);
        if (!result.success) {
            toast.error(t("addTag.errorAdd"));
            setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
            setFiles(files.map((f) => f.id === file.id ? { ...f, tags: f.tags.filter((t) => t.id !== tag.id) } : f));
        }
    }

    const handleTagUnselected = async (tag: FolderTag) => {
        setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
        setFiles(files.map((f) => f.id === file.id ? { ...f, tags: f.tags.filter((t) => t.id !== tag.id) } : f));
        const result = await removeTagsFromFile(file.id, [tag.id]);
        if (!result.success) {
            toast.error(t("addTag.errorRemove"));
            setSelectedTags([...selectedTags, tag]);
            setFiles(files.map((f) => f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f));
        }
    }

    return (
        <Dialog>
            <DialogTrigger className={className} {...props} asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>
                        {t("description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <Label>{t("selectedTags")} <span className="text-sm text-muted-foreground"><AddTagPopover onTagAdded={handleTagAdded} folderId={file.folder.id} fileId={file.id} /></span></Label>

                    {selectedTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tag) => (
                                <TagChip key={tag.id} tag={tag} checked={true} showCheckbox onTagSelected={handleTagSelected} onTagUnselected={handleTagUnselected} />
                            ))}
                        </div>
                    ) : (
                        <p className="flex items-center gap-2 my-[3px] text-muted-foreground text-sm"><BrushCleaning /> {t("noSelectedTags")}</p>
                    )}
                </div>

                <div className="grid gap-4">
                    <Label>{t("folderTags")} <span className="text-sm text-muted-foreground"><AddTagPopover onTagAdded={handleTagAdded} folderId={file.folder.id} fileId={file.id} /></span></Label>
                    {folderTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {folderTags.map((tag) => (
                                <TagChip key={tag.id} tag={tag} checked={selectedTags.some((t) => t.id === tag.id)} showCheckbox onTagSelected={handleTagSelected} onTagUnselected={handleTagUnselected} />
                            ))}
                        </div>
                    ) : (
                        <p className="flex items-center gap-2 my-[3px] text-muted-foreground text-sm"><BrushCleaning /> {t("noFolderTags")}</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}