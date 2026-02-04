import { UploadImagesDialog } from "@/components/files/upload/UploadImagesDialog";
import SortImages from "@/components/folders/SortImages";
import ViewSelector, { ViewState } from "@/components/folders/ViewSelector";
import { useFolderContext } from "@/context/FolderContext";
import { useFilesContext } from "@/context/FilesContext";
import { FolderTokenPermission } from "@prisma/client";
import FolderActionDropdown from "@/components/folders/actions/FolderActionDropdown";
import FolderActionDropdownMobile from "@/components/folders/actions/FolderActionDropdownMobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/lib/auth-client";

/**
 * Renders action controls for a folder including view and sort selectors, upload/share/download actions, map navigation, and description editing.
 *
 * Access to upload and share actions is gated by session and folder token permissions. Uploads append new files to the current files list. The download action starts a toast notification and triggers the top loader completion after a short delay. Map links preserve sharing token parameters when present.
 *
 * @returns The FolderActionBar component's JSX element containing menu triggers, dialogs (upload, share, edit description), and view/sort controls.
 */
export default function FolderActionBar() {
	const isMobile = useIsMobile();
	const { data: session } = useSession();
	const { folder, token, isShared } = useFolderContext();
	const { viewState, sortState, setViewState, setSortState, files, setFiles } = useFilesContext();

	if (isMobile) return <FolderActionDropdownMobile />;

	return (
		<div className="flex gap-4">
			<ViewSelector viewState={viewState} setViewState={setViewState} />
			{viewState === ViewState.Grid ? (
				<SortImages sortState={sortState} setSortState={setSortState} />
			) : null}
			{session !== undefined || token?.permission === FolderTokenPermission.WRITE ? (
				<UploadImagesDialog
					folderId={folder.id}
					shouldDisplayNotify={session !== undefined && !isShared}
					onUpload={uploadedFiles => {
						setFiles([...files, ...uploadedFiles]);
					}}
				/>
			) : null}
			<FolderActionDropdown />
		</div>
	);
}
