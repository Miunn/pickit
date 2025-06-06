import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { FileWithTags, FolderWithTags } from "@/lib/definitions";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { BrushCleaning, Loader2 } from "lucide-react";
import { PopoverNonPortal, PopoverContent, PopoverTrigger } from "../ui/popover-non-portal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { createTag } from "@/actions/tags";
import { toast } from "sonner";
import { FolderTag } from "@prisma/client";

interface AddTagPopoverProps {
    onTagAdded: (tag: FolderTag) => void;
    folderId: string;
    fileId: string;
}

const AddTagPopover = ({ onTagAdded, folderId, fileId }: AddTagPopoverProps) => {
    const t = useTranslations("dialogs.files.addTag");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleAdd = async () => {
        setLoading(true);
        const result = await createTag(name, folderId, fileId);
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
    const [otherTags, setOtherTags] = useState<FolderTag[]>([]);

    const handleTagAdded = (tag: FolderTag) => {
        setSelectedTags([...selectedTags, tag]);
        setFolderTags([...folderTags, tag]);
    };

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

                    {file.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tag) => (
                                <Badge key={tag.id}>{tag.name}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="flex items-center gap-2 text-muted-foreground text-sm"><BrushCleaning /> {t("noSelectedTags")}</p>
                    )}
                </div>

                <div className="grid gap-4">
                    <Label>{t("folderTags")} <span className="text-sm text-muted-foreground"><AddTagPopover onTagAdded={handleTagAdded} folderId={file.folder.id} fileId={file.id} /></span></Label>
                    {file.folder.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {folderTags.map((tag) => (
                                <Badge key={tag.id}>{tag.name}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="flex items-center gap-2 text-muted-foreground text-sm"><BrushCleaning /> {t("noFolderTags")}</p>
                    )}
                </div>

                <div className="grid gap-4">
                    <Label>{t("otherTags")}</Label>
                    <div className="flex flex-wrap gap-2">
                        {otherTags.map((tag) => (
                            <Badge key={tag.id}>{tag.name}</Badge>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}