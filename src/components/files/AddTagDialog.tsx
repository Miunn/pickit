import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { FileWithTags } from "@/lib/definitions";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Brush, BrushCleaning } from "lucide-react";

export default function AddTagDialog({ children, file, className, ...props }: { children: React.ReactNode, file: FileWithTags, className?: string } & React.ComponentProps<typeof DialogTrigger>) {
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
                        <p className="flex items-center gap-2 text-muted-foreground text-sm"><BrushCleaning /> {t("noSelectedTags")}</p>
                    )}
                </div>

                <div className="grid gap-4">
                    <Label>{t("folderTags")}</Label>
                    <div className="flex flex-wrap gap-2">
                        {file.tags.map((tag) => (
                            <Badge key={tag.id}>{tag.name}</Badge>
                        ))}
                    </div>
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