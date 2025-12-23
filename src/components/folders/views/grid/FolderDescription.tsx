import EditDescriptionDialog from "@/components/folders/dialogs/EditDescriptionDialog";
import { Button } from "@/components/ui/button";
import { useFolderContext } from "@/context/FolderContext";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/SessionProvider";
import { Pencil, Trash2 } from "lucide-react";
import DeleteDescriptionDialog from "../../dialogs/DeleteDescriptionDialog";

export default function FolderDescription({ className }: { className?: string }) {
    const { user } = useSession();
    const { folder } = useFolderContext();

    return (
        <div className={cn("relative group overflow-auto", "border border-primary rounded-lg p-4", className)}>
            <p className={"text-sm text-muted-foreground whitespace-pre-wrap"}>{folder.description}</p>
            {folder.createdById === user?.id ? (
                <div className="flex sm:flex-col gap-2 absolute top-2 right-2 group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                    <EditDescriptionDialog folder={folder}>
                        <Button variant="ghost" size="icon">
                            <Pencil className={"w-4 h-4"} />
                        </Button>
                    </EditDescriptionDialog>
                    <DeleteDescriptionDialog folder={folder}>
                        <Button variant="ghost" size="icon">
                            <Trash2 className={"w-4 h-4"} />
                        </Button>
                    </DeleteDescriptionDialog>
                </div>
            ) : null}
        </div>
    );
}
