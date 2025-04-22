import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Folder, File, FileType } from "@prisma/client";
import { FolderWithCreatedBy, FolderWithFilesWithFolderAndComments, FileWithFolder, FolderWithImages } from "./definitions";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner"
import { ImagesSortMethod } from "@/components/folders/SortImages";
import saveAs from "file-saver";
import JSZip from "jszip";
import { Progress } from "@/components/ui/progress";
import { getFolderFull } from "@/actions/folders";
import { getFolderFullFromAccessTokenServer } from "@/actions/tokenValidation";

export function formatBytes(
	bytes: number,
	opts: {
		decimals?: number
		sizeType?: "accurate" | "normal"
	} = {}
) {
	const { decimals = 0, sizeType = "normal" } = opts

	const sizes = ["B", "KB", "MB", "GB", "TB"]
	const accurateSizes = ["B", "KiB", "MiB", "GiB", "TiB"]
	if (bytes === 0) return "0 B"
	const i = Math.floor(Math.log(bytes) / Math.log(1024))
	return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "B"}`
}

export const convertDDtoDMS = (dd: number): { degrees: number, minutes: number, seconds: number } => {
	const abs = Math.abs(dd);
	const degrees = Math.floor(abs);
	const minutes = Math.floor((abs - degrees) * 60);
	const seconds = Math.floor((abs - degrees - minutes / 60) * 3600);

	return { degrees, minutes, seconds };
}

export const getDMSstringWithDirection = (degrees: number, minutes: number, seconds: number, direction: "N" | "S" | "E" | "W"): string => {
	return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

export const getCoordinatesString = (latitude: number, longitude: number): string => {
	const latitudeDMS = convertDDtoDMS(latitude);
	const longitudeDMS = convertDDtoDMS(longitude);

	return `${getDMSstringWithDirection(latitudeDMS.degrees, latitudeDMS.minutes, latitudeDMS.seconds, latitude < 0 ? "S" : "N")}, ${getDMSstringWithDirection(longitudeDMS.degrees, longitudeDMS.minutes, longitudeDMS.seconds, longitude < 0 ? "W" : "E")}`;
}

export const switchLocaleUrl = (url: string, locale: string): string => {
	// Remove the locale from the url
	url = url.replace(/\/[a-z]{2}\/?/, "/");

	if (url.startsWith("/")) {
		return `/${locale}${url}`;
	}

	return `/${locale}/${url}`;
}

export const copyImageToClipboard = async (folderId: string, imageId: string, shareToken?: string, shareHashPin?: string, tokenType?: "accessToken" | "personAccessToken" | null): Promise<boolean> => {
	let image = await (await fetch(`/api/folders/${folderId}/images/${imageId}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`)).blob();
	image = image.slice(0, image.size, "image/png")

	navigator.clipboard.write([
		new ClipboardItem({
			[image.type]: image
		})
	]);

	return true;
}

export const downloadClientImageHandler = async (file: FileWithFolder) => {
	const r = await fetch(`/api/folders/${file.folder.id}/${file.type === FileType.VIDEO ? 'videos' : 'images'}/${file.id}/download`);

	if (r.status === 404) {
		toast({
			title: "No images found",
			description: "There are no images in this folder to download"
		});
		return;
	}

	if (r.status !== 200) {
		toast({
			title: "Error",
			description: "An error occurred while trying to download this folder",
			variant: "destructive"
		});
		return;
	}

	saveAs(await r.blob(), `${file.name}.${file.extension}`);
}

export const downloadClientFolder = async (folder: Folder | FolderWithFilesWithFolderAndComments, t: any, shareToken?: string | null, tokenType?: "accessToken" | "personAccessToken" | null, hashPinCode?: string | null) => {
	let folderWithImagesAndVideos: FolderWithFilesWithFolderAndComments;
	if (!('files' in folder)) {
		const r = await getFolderFull(folder.id, shareToken, tokenType, hashPinCode);

		if (r.error || !r.folder) {
			toast({
				title: "Error",
				description: r.error,
				variant: "destructive"
			});
			return;
		}

		folderWithImagesAndVideos = r.folder;
	} else {
		folderWithImagesAndVideos = folder as FolderWithFilesWithFolderAndComments;
	}

	sonnerToast(
		<div className="w-full">{ t('ongoing.title') }</div>,
		{
			id: "download-progress-toast",
			duration: Infinity,
			classNames: {
				content: "w-full",
				title: "w-full"
			},
			description: <div className="w-full">
				{ t('ongoing.description', { name: folder.name }) }
				<Progress value={0} className="w-full mt-2" />
			</div>,
			dismissible: false
		}
	)

	const zip = new JSZip();
	const totalFiles = folderWithImagesAndVideos.files.length;

	for (let i = 0; i < folderWithImagesAndVideos.files.length; i++) {
		const file = folderWithImagesAndVideos.files[i];
		const r = await fetch(`/api/folders/${folder.id}/${file.type === FileType.VIDEO ? 'videos' : 'images'}/${file.id}/download`);

		const buffer = await r.arrayBuffer();

		zip.file(`${file.name}-${file.createdAt.getTime()}.${file.extension}`, buffer);

		sonnerToast(
			<div className="w-full">{ t('ongoing.title') }</div>,
			{
				id: "download-progress-toast",
				description: <div className="w-full">
					{ t('ongoing.description', { name: folder.name }) }
					<Progress value={(i + 1) / totalFiles * 100} className="w-full mt-2" />
				</div>
			}
		)
	}

	for (let i = 0; i < folderWithImagesAndVideos.files.length; i++) {
		const file = folderWithImagesAndVideos.files[i];
		const r = await fetch(`/api/folders/${folder.id}/${file.type === FileType.VIDEO ? 'videos' : 'images'}/${file.id}/download`);

		const buffer = await r.arrayBuffer();

		zip.file(`${file.name}-${file.createdAt.getTime()}.${file.extension}`, buffer);

		sonnerToast(
			<div className="w-full">{ t('ongoing.title') }</div>,
			{
				id: "download-progress-toast",
				description: <div className="w-full">
					{ t('ongoing.description', { name: folder.name }) }
					<Progress value={(i + 1) / totalFiles * 100} className="w-full mt-2" />
				</div>
			}
		)
	}

	const zipData = await zip.generateAsync({ type: "blob" });

	setTimeout(() => {
		sonnerToast.dismiss("download-progress-toast");
	}, 1000);

	sonnerToast.success(t('success', { name: folder.name }));

	saveAs(zipData, `${folder.name}.zip`);
}

export const getSortedFolderContent = (folderContent: FolderWithFilesWithFolderAndComments, sort: ImagesSortMethod): FolderWithFilesWithFolderAndComments => {
	switch (sort) {
		case ImagesSortMethod.NameAsc:
			return {
				...folderContent,
				files: folderContent.files.sort((a, b) => a.name.localeCompare(b.name) || a.createdAt.getTime() - b.createdAt.getTime())
			}
		case ImagesSortMethod.NameDesc:
			return {
				...folderContent,
				files: folderContent.files.sort((a, b) => b.name.localeCompare(a.name) || a.createdAt.getTime() - b.createdAt.getTime())
			}
		case ImagesSortMethod.SizeAsc:
			return {
				...folderContent,
				files: folderContent.files.sort((a, b) => a.size - b.size || a.name.localeCompare(b.name))
			}
		case ImagesSortMethod.SizeDesc:
			return {
				...folderContent,
				files: folderContent.files.sort((a, b) => b.size - a.size || a.name.localeCompare(b.name))
			}
		case ImagesSortMethod.DateAsc:
			return {
				...folderContent,
				files: folderContent.files.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.name.localeCompare(b.name))
			}
		case ImagesSortMethod.DateDesc:
			return {
				...folderContent,
				files: folderContent.files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.name.localeCompare(b.name))
			}
		default:
			return folderContent;
	}
}

export const getSortedImagesVideosContent = (arr: FileWithFolder[], sort: ImagesSortMethod): FileWithFolder[] => {
	switch (sort) {
		case ImagesSortMethod.NameAsc:
			return arr.sort((a, b) => a.name.localeCompare(b.name) || a.createdAt.getTime() - b.createdAt.getTime())
		case ImagesSortMethod.NameDesc:
			return arr.sort((a, b) => b.name.localeCompare(a.name) || a.createdAt.getTime() - b.createdAt.getTime())
		case ImagesSortMethod.SizeAsc:
			return arr.sort((a, b) => a.size - b.size || a.name.localeCompare(b.name))
		case ImagesSortMethod.SizeDesc:
			return arr.sort((a, b) => b.size - a.size || a.name.localeCompare(b.name))
		case ImagesSortMethod.DateAsc:
			return arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.name.localeCompare(b.name))
		case ImagesSortMethod.DateDesc:
			return arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.name.localeCompare(b.name))
		case ImagesSortMethod.PositionAsc:
			return arr.sort((a, b) => a.position - b.position)
		case ImagesSortMethod.PositionDesc:
			return arr.sort((a, b) => b.position - a.position)
		default:
			return arr;
	}
}

export const getFolderFullFromAccessToken = async (folderId: string, token: string, type: "accessToken" | "personAccessToken"):
	Promise<{ error: string | null, folder: (FolderWithFilesWithFolderAndComments & FolderWithCreatedBy) | null }> => {
	return getFolderFullFromAccessTokenServer(folderId, token, type);
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}