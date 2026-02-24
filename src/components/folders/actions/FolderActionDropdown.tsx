import EditDescriptionDialog from "@/components/folders/dialogs/EditDescriptionDialog";
import { UploadImagesDialog } from "@/components/files/upload/UploadImagesDialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFolderContext } from "@/context/FolderContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTopLoader } from "nextjs-toploader";
import { useState } from "react";
import { ShareFolderDialog } from "@/components/folders/dialogs/ShareFolderDialog";
import { useFilesContext } from "@/context/FilesContext";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function FolderActionDropdown() {
	const t = useTranslations("folders");
	const { folder, token, tokenHash, isShared } = useFolderContext();
	const { files, setFiles } = useFilesContext();
	const { data: session } = useSession();
	const { done } = useTopLoader();

	const [openUpload, setOpenUpload] = useState(false);
	const [openShare, setOpenShare] = useState(false);
	const [openEditDescription, setOpenEditDescription] = useState(false);

	const handleDownload = () => {
		toast({
			title: t("downloadStarted"),
			description: t("downloadStartedDescription", { name: folder.name }),
		});
		setTimeout(() => {
			done();
		}, 1000);
	};

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size={"icon"}>
						<MoreHorizontal className="w-4 h-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem
						className={cn((folder.description || !session) && "hidden")}
						onClick={() => setOpenEditDescription(true)}
					>
						{t("addDescription")}
					</DropdownMenuItem>
					<DropdownMenuItem
						className={cn(!session && !token?.allowMap && "hidden")}
						asChild
					>
						<Link href={`/app/map?share=${token?.token}&h=${tokenHash}`}>
							{t("actions.map")}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						className={cn(!session && "hidden")}
						onClick={() => setOpenShare(true)}
					>
						{t("share.label")}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleDownload} asChild>
						<a
							href={`/api/folders/${folder.id}/download?share=${token?.token}&h=${tokenHash}`}
							download
						>
							{t("download.label")}
						</a>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<EditDescriptionDialog
				open={openEditDescription}
				setOpen={setOpenEditDescription}
				folder={folder}
			/>
			<UploadImagesDialog
				open={openUpload}
				setOpen={setOpenUpload}
				shouldDisplayNotify={isShared}
				folderId={folder.id}
				onUpload={uploadedFiles => {
					setFiles([...files, ...uploadedFiles]);
				}}
			/>
			<ShareFolderDialog open={openShare} setOpen={setOpenShare} folder={folder} />
		</>
	);
}
