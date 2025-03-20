import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Folder, FolderTokenPermission } from "@prisma/client";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImages, FolderWithImagesWithFolderAndComments, ImageWithFolder, UploadImagesFormSchema } from "./definitions";
import { z } from "zod";
import { uploadImages } from "@/actions/images";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner"
import { UseFormReturn } from "react-hook-form";
import { prisma } from "./prisma";
import * as bcrypt from "bcryptjs";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import saveAs from "file-saver";
import JSZip from "jszip";
import { Progress } from "@/components/ui/progress";
import { getFolderFull } from "@/actions/folders";

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
	return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "B"
		}`
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

export const downloadClientImageHandler = async (image: ImageWithFolder) => {
	const r = await fetch(`/api/folders/${image.folder.id}/images/${image.id}/download`);

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

	saveAs(await r.blob(), `${image.name}.${image.extension}`);
}

export const downloadClientFolder = async (folder: Folder | FolderWithImages, shareToken?: string, tokenType?: "accessToken" | "personAccessToken", hashPinCode?: string) => {
	let folderWithImages: FolderWithImages;
	if (!('images' in folder)) {
		const r = await getFolderFull(folder.id, shareToken, tokenType, hashPinCode);

		if (r.error || !r.folder) {
			toast({
				title: "Error",
				description: r.error,
				variant: "destructive"
			});
			return;
		}

		folderWithImages = r.folder;
	} else {
		folderWithImages = folder as FolderWithImages;
	}

	sonnerToast(
		<div className="w-full" >
			Download started
		</div>,
		{
			id: "download-progress-toast",
			duration: Infinity,
			classNames: {
				content: "w-full",
				title: "w-full"
			},
			description: <div className="w-full">
				Your folder is being downloaded. Please wait while we prepare the files for you.
				<Progress value={0} className="w-full mt-2" />
			</div>
		}
	)

	const zip = new JSZip();

	for (let i = 0; i < folderWithImages.images.length; i++) {
		const image = folderWithImages.images[i];
		const r = await fetch(`/api/folders/${folder.id}/images/${image.id}/download`);

		const buffer = await r.arrayBuffer();

		zip.file(`${image.name}-${image.createdAt.getTime()}.${image.extension}`, buffer);

		sonnerToast(
			<div className="w-full" >
				Download started
			</div>,
			{
				id: "download-progress-toast",
				description: <div className="w-full">
					Your folder is being downloaded. Please wait while we prepare the files for you.
					<Progress value={(i + 1) / folderWithImages.images.length * 100} className="w-full mt-2" />
				</div>
			}
		)
	}

	const zipData = await zip.generateAsync({ type: "blob" });

	setTimeout(() => {
		sonnerToast.dismiss("download-progress-toast");
	}, 1000);

	sonnerToast.success(`${folder.name} downloaded successfully`)

	//const r = await fetch(`/api/folders/${folder.id}/download`);

	// if (r.status === 404) {
	// 	toast({
	// 		title: "No images found",
	// 		description: "There are no images in this folder to download"
	// 	});
	// 	return;
	// }

	// if (r.status !== 200) {
	// 	toast({
	// 		title: "Error",
	// 		description: "An error occurred while trying to download this folder",
	// 		variant: "destructive"
	// 	});
	// 	return;
	// }

	saveAs(zipData, `${folder.name}.zip`);
}

export const getSortedFolderContent = (folderContent: FolderWithImagesWithFolderAndComments, sort: ImagesSortMethod): FolderWithImagesWithFolderAndComments => {
	switch (sort) {
		case ImagesSortMethod.NameAsc:
			return {
				...folderContent,
				images: folderContent.images.sort((a, b) => a.name.localeCompare(b.name) || a.createdAt.getTime() - b.createdAt.getTime())
			}
		case ImagesSortMethod.NameDesc:
			return {
				...folderContent,
				images: folderContent.images.sort((a, b) => b.name.localeCompare(a.name) || a.createdAt.getTime() - b.createdAt.getTime())
			}
		case ImagesSortMethod.SizeAsc:
			return {
				...folderContent,
				images: folderContent.images.sort((a, b) => a.size - b.size || a.name.localeCompare(b.name))
			}
		case ImagesSortMethod.SizeDesc:
			return {
				...folderContent,
				images: folderContent.images.sort((a, b) => b.size - a.size || a.name.localeCompare(b.name))
			}
		case ImagesSortMethod.DateAsc:
			return {
				...folderContent,
				images: folderContent.images.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.name.localeCompare(b.name))
			}
		case ImagesSortMethod.DateDesc:
			return {
				...folderContent,
				images: folderContent.images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.name.localeCompare(b.name))
			}
		default:
			return folderContent;
	}
}

export const validateShareToken = async (folderId: string, token: string, type: "accessToken" | "personAccessToken", hashedPinCode?: string | null): Promise<{ error: string | null, folder: (FolderWithCreatedBy & FolderWithImagesWithFolderAndComments & FolderWithAccessToken) | null, permission?: FolderTokenPermission }> => {
	let accessToken;
	if (type === "accessToken") {
		accessToken = await prisma.accessToken.findUnique({
			where: {
				token: token,
				folderId: folderId,
				expires: {
					gte: new Date()
				}
			},
			include: {
				folder: {
					include: {
						images: {
							include: {
								folder: true,
								comments: { include: { createdBy: true } }
							}
						},
						createdBy: true
					}
				}
			},
			omit: {
				pinCode: false
			}
		});
	} else if (type === "personAccessToken") {
		accessToken = await prisma.personAccessToken.findUnique({
			where: {
				token: token,
				folderId: folderId,
				expires: {
					gte: new Date()
				}
			},
			include: {
				folder: {
					include: {
						images: {
							include: {
								folder: true,
								comments: { include: { createdBy: true } }
							}
						},
						createdBy: true
					}
				}
			},
			omit: {
				pinCode: false
			}
		});
	} else {
		return { error: "invalid-token-type", folder: null };
	}

	if (!accessToken) {
		return { error: "invalid-token", folder: null };
	}

	if (accessToken.locked && !hashedPinCode) {
		return { error: "code-needed", folder: null };
	}

	if (accessToken.locked) {
		if (!hashedPinCode) {
			return { error: "wrong-pin", folder: null };
		}

		const match = bcrypt.compareSync(accessToken.pinCode as string, hashedPinCode);

		if (!match) {
			return { error: "wrong-pin", folder: null };
		}
	}

	return { error: null, folder: { ...accessToken.folder, AccessToken: [] }, permission: accessToken.permission };
}

export const getFolderFullFromAccessToken = async (folderId: string, token: string, type: "accessToken" | "personAccessToken"):
	Promise<{ error: string | null, folder: (FolderWithImagesWithFolderAndComments & FolderWithCreatedBy) | null }> => {
	let accessToken;

	if (type === "accessToken") {
		accessToken = await prisma.accessToken.findUnique({
			where: {
				token: token,
				folderId: folderId,
				expires: {
					gte: new Date()
				}
			},
			include: {
				folder: { include: { images: { include: { folder: true, comments: { include: { createdBy: true } } } }, createdBy: true } }
			}
		});
	} else if (type === "personAccessToken") {
		accessToken = await prisma.personAccessToken.findUnique({
			where: {
				token: token,
				folderId: folderId,
				expires: {
					gte: new Date()
				}
			},
			include: {
				folder: { include: { images: { include: { folder: true, comments: { include: { createdBy: true } } } }, createdBy: true } }
			}
		});
	} else {
		return { error: "invalid-token-type", folder: null };
	}

	if (!accessToken) {
		return { error: "invalid-token", folder: null };
	}

	return { error: null, folder: accessToken.folder };
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function computeUsedStorage(folders: FolderWithImages[]): number {
	return folders.reduce((acc, folder) => acc + folder.images.reduce((acc, image) => acc + image.size, 0), 0)
}