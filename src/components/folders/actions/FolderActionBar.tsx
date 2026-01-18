import { UploadImagesDialog } from "../../files/upload/UploadImagesDialog";
import SortImages from "../SortImages";
import ViewSelector, { ViewState } from "../ViewSelector";
import { useFolderContext } from "@/context/FolderContext";
import { useFilesContext } from "@/context/FilesContext";
import { useSession } from "@/providers/SessionProvider";
import { FolderTokenPermission } from "@prisma/client";
import FolderActionDropdown from "./FolderActionDropdown";
import FolderActionDropdownMobile from "./FolderActionDropdownMobile";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Renders action controls for a folder including view and sort selectors, upload/share/download actions, map navigation, and description editing.
 *
 * Access to upload and share actions is gated by session and folder token permissions. Uploads append new files to the current files list. The download action starts a toast notification and triggers the top loader completion after a short delay. Map links preserve sharing token parameters when present.
 *
 * @returns The FolderActionBar component's JSX element containing menu triggers, dialogs (upload, share, edit description), and view/sort controls.
 */
export default function FolderActionBar() {
	const isMobile = useIsMobile();
	const { isGuest } = useSession();
	const { folder, token, isShared } = useFolderContext();
	const { viewState, sortState, setViewState, setSortState, files, setFiles } = useFilesContext();

	if (isMobile) return <FolderActionDropdownMobile />;

	return (
		<div className="flex gap-4">
			<ViewSelector viewState={viewState} setViewState={setViewState} />
			{viewState === ViewState.Grid ? (
				<SortImages sortState={sortState} setSortState={setSortState} />
			) : null}
			{!isGuest || token?.permission === FolderTokenPermission.WRITE ? (
				<UploadImagesDialog
					folderId={folder.id}
					shouldDisplayNotify={!isGuest && !isShared}
					onUpload={uploadedFiles => {
						setFiles([...files, ...uploadedFiles]);
					}}
				/>
			) : null}
			<FolderActionDropdown />
		</div>
	);
}
