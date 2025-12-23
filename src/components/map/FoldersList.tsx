import { MoreHorizontal } from "lucide-react";
import { useFormatter } from "next-intl";
import { Checkbox } from "../ui/checkbox";
import { useState } from "react";
import { FolderWithFilesCount } from "@/lib/definitions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { FolderCard } from "./FolderCard";

/**
 * Renders a responsive folder list that allows selecting and deselecting folders and notifies the caller of selection changes.
 *
 * The component shows a grid of FolderCard items on large screens and a compact dropdown with checkboxes on small screens.
 *
 * @param folders - Array of folders with file counts to display and control selection for.
 * @param onSelectionChange - Callback invoked with the updated set of selected folder IDs whenever the selection changes.
 * @returns The JSX element for the folder selection UI.
 */
export default function FoldersList({
    folders,
    onSelectionChange,
}: {
    folders: FolderWithFilesCount[];
    onSelectionChange: (selectedFolders: Set<string>) => void;
}) {
    const formatter = useFormatter();
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set(folders.map(folder => folder.id)));

    const toggleFolderSelection = (folderId: string) => {
        setSelectedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            onSelectionChange(newSet);
            return newSet;
        });
    };

    return (
        <>
            <div className="hidden lg:flex flex-col gap-2">
                {folders.map(folder => (
                    <FolderCard
                        key={folder.id}
                        folder={folder}
                        isSelected={selectedFolders.has(folder.id)}
                        onToggle={() => toggleFolderSelection(folder.id)}
                        formatter={formatter}
                    />
                ))}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger className="lg:hidden" asChild>
                    <Button variant="outline" size="icon">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {folders.map(folder => (
                        <DropdownMenuItem
                            key={folder.id}
                            onClick={() => toggleFolderSelection(folder.id)}
                            className="flex items-center gap-2"
                        >
                            <Checkbox checked={selectedFolders.has(folder.id)} />
                            <p>{folder.name}</p>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}