import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { FileWithTags, FolderWithTags } from "@/lib/definitions";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { BrushCleaning } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { createTag } from "@/actions/tags";
import { toast } from "sonner";

export default function ManageTagsDialog({ children, file, className, ...props }: { children: React.ReactNode, file: { folder: FolderWithTags } & FileWithTags, className?: string } & React.ComponentProps<typeof DialogTrigger>) {
    const t = useTranslations("dialogs.files.addTag");

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
                    <Label>{t("selectedTags")}</Label>

                    {file.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {file.tags.map((tag) => (
                                <Badge key={tag.id}>{tag.name}</Badge>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <p className="flex items-center gap-2"><BrushCleaning /> {t("noSelectedTags")}</p>
                            <AddTagPopover file={file} />
                        </div>
                    )}
                </div>

                <div className="grid gap-4">
                    <Label>{t("folderTags")}</Label>
                    {file.folder.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {file.tags.map((tag) => (
                                <Badge key={tag.id}>{tag.name}</Badge>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <p className="flex items-center gap-2">
                                <BrushCleaning /> {t("noFolderTags")}
                            </p>
                            <AddTagPopover file={file} />
                        </div>
                    )}
                </div>

                <div className="grid gap-4">
                    <Label>{t("otherTags")}</Label>
                    <div className="flex flex-wrap gap-2">
                        {file.tags.map((tag) => (
                            <Badge key={tag.id}>{tag.name}</Badge>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const AddTagPopover = ({ file }: { file: { folder: FolderWithTags } & FileWithTags }) => {
    const t = useTranslations("dialogs.files.addTag");
    const [name, setName] = useState("");

    const handleAdd = async () => {
        const { success } = await createTag(name, file.folder.id, file.id);

        if (success) {
            setName("");
            toast.success(t("addTag.success"));
        }
    }

    return (
        <Popover modal={true}>
            <PopoverTrigger asChild>
                <button className="underline cursor-pointer">{t("addTag.addFirst")}</button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-2">
                <Label>{t("addTag.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />

                <Button onClick={handleAdd}>{t("addTag.add")}</Button>
            </PopoverContent>
        </Popover>
    )
}