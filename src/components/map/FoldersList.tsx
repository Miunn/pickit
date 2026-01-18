import { MoreHorizontal } from "lucide-react";
import { useFormatter } from "next-intl";
import { Checkbox } from "../ui/checkbox";
import { useEffect, useState } from "react";
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
	displayedFilesByFolder,
	onSelectionChange,
}: {
	readonly folders: FolderWithFilesCount[];
	readonly displayedFilesByFolder: Record<string, number>;
	readonly onSelectionChange: (selectedFolders: string[]) => void;
}) {
	const formatter = useFormatter();
	const [selectedFolders, setSelectedFolders] = useState<string[]>(() => folders.map(folder => folder.id));

	const toggleFolderSelection = (folderId: string) => {
		setSelectedFolders(prev => {
			if (prev.includes(folderId)) {
				return prev.filter(id => id !== folderId);
			}

			return [...prev, folderId];
		});
	};

	useEffect(() => {
		setSelectedFolders(prev => {
			const newFoldersIds = folders.map(f => f.id).filter(id => !prev.includes(id));
			if (newFoldersIds.length > 0) {
				onSelectionChange([...prev, ...newFoldersIds]);
			}
			return [...prev, ...newFoldersIds];
		});
	}, [folders, onSelectionChange]);

	return (
		<>
			<div className="hidden lg:flex flex-col gap-2">
				{folders.map(folder => (
					<FolderCard
						key={folder.id}
						folder={folder}
						ignoredFiles={
							folder._count.files - (displayedFilesByFolder[folder.id] || 0)
						}
						isSelected={selectedFolders.includes(folder.id)}
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
							<Checkbox checked={selectedFolders.includes(folder.id)} />
							<p>{folder.name}</p>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
