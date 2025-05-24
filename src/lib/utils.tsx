import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FileType } from "@prisma/client";
import { FolderWithFilesWithFolderAndComments, FileWithFolder } from "./definitions";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner"
import { ImagesSortMethod } from "@/components/folders/SortImages";
import saveAs from "file-saver";
import JSZip from "jszip";
import { Progress } from "@/components/ui/progress";
import axios, { AxiosRequestConfig } from "axios";
import { Loader2 } from "lucide-react";

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

export const downloadClientFiles = async (translations: (key: string, params?: Record<string, string | number>) => string, files: FileWithFolder[], title: string, shareToken?: string | null, tokenType?: "accessToken" | "personAccessToken" | null, hashPinCode?: string | null) => {
	const zip = new JSZip();
	const totalFiles = files.length;
	const totalSizes = files.reduce((acc, file) => acc + file.size, 0);
	console.log("Total sizes", totalSizes);
	let downloadedSize = 0;

	sonnerToast(
		<div className="w-full">{translations('ongoing.title', { name: title })}</div>,
		{
			id: "download-progress-toast",
			duration: Infinity,
			classNames: {
				content: "w-full",
				title: "w-full"
			},
			description: <div className="w-full">
				<p className="flex justify-between items-center gap-2 relative">
					<span className="flex-1 truncate">{translations('ongoing.description.name', { name: `${files[0].name}.${files[0].extension}` })}</span>
					<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {translations('ongoing.description.progress', { currentPercentage: 0, count: 1, total: totalFiles })}</span>
				</p>
				<Progress value={0} className="w-full mt-2" />
			</div>,
			dismissible: false
		}
	)

	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		const axiosConfig: AxiosRequestConfig = {
			responseType: "blob",
			onDownloadProgress: (progressEvent) => {
				if (progressEvent.total) {
					sonnerToast(
						<div className="w-full">{translations('ongoing.title', { name: title })}</div>,
						{
							id: "download-progress-toast",
							description: <div className="w-full">
								<p className="flex justify-between items-center gap-2 relative">
									<span className="flex-1 truncate">{translations('ongoing.description.name', { name: `${file.name}.${file.extension}` })}</span>
									<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {translations('ongoing.description.progress', { currentPercentage: (progressEvent.loaded / progressEvent.total * 100).toFixed(2), count: i + 1, total: totalFiles })}</span>
								</p>
								<Progress value={(downloadedSize + progressEvent.loaded) / totalSizes * 100} className="w-full mt-2" />
							</div>,
						}
					)
				}
			},
		};

		const signedUrl = await fetch(`/api/folders/${file.folderId}/${file.type === FileType.VIDEO ? 'videos' : 'images'}/${file.id}/download-url?share=${shareToken}&h=${hashPinCode}&t=${tokenType === "personAccessToken" ? "p" : "a"}`);
		const signedUrlData = await signedUrl.json();
		const r = await axios.get(signedUrlData.url, axiosConfig);

		const buffer = await r.data.arrayBuffer();

		zip.file(`${file.name}-${file.createdAt.getTime()}.${file.extension}`, buffer);
		downloadedSize += buffer.byteLength;
	}

	const zipData = await zip.generateAsync({ type: "blob" });

	sonnerToast(
		<div className="w-full">{translations('success.title', { name: title })}</div>,
		{
			id: "download-progress-toast",
			duration: 5000,
			classNames: {
				content: "w-full",
				title: "w-full"
			},
			description: <div className="w-full">
				{translations('success.description', { name: title })}
				<Progress value={100} className="w-full mt-2" />
			</div>,
			dismissible: true
		}
	)

	saveAs(zipData, `${title}.zip`);
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

export const getSortedImagesVideosContent = (arr: FileWithFolder[], sort: ImagesSortMethod) => {
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

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}