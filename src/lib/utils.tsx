import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Folder, FolderTokenPermission, Image, Video } from "@prisma/client";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImages, FolderWithImagesWithFolderAndComments, FolderWithVideos, FolderWithVideosWithFolderAndComments, ImageWithFolder, UploadImagesFormSchema, VideoWithFolder } from "./definitions";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner"
import { prisma } from "./prisma";
import * as bcrypt from "bcryptjs";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import saveAs from "file-saver";
import JSZip from "jszip";
import { Progress } from "@/components/ui/progress";
import { getFolderFull } from "@/actions/folders";
import sharp from "sharp";
import mediaInfoFactory, { MediaInfoResult } from 'mediainfo.js';

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

export const downloadClientImageHandler = async (file: ImageWithFolder | VideoWithFolder) => {
	const r = await fetch(`/api/folders/${file.folder.id}/${file.type === 'video' ? 'videos' : 'images'}/${file.id}/download`);

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

export const downloadClientFolder = async (folder: Folder | FolderWithImages | FolderWithVideos, t: any, shareToken?: string, tokenType?: "accessToken" | "personAccessToken", hashPinCode?: string) => {
	let folderWithImagesAndVideos: FolderWithImages & FolderWithVideos;
	if (!('images' in folder) || !('videos' in folder)) {
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
		folderWithImagesAndVideos = folder as FolderWithImages & FolderWithVideos;
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
				{ t('ongoing.description') }
				<Progress value={0} className="w-full mt-2" />
			</div>,
			dismissible: false
		}
	)

	const zip = new JSZip();
	const totalFiles = folderWithImagesAndVideos.images.length + folderWithImagesAndVideos.videos.length;

	for (let i = 0; i < folderWithImagesAndVideos.images.length; i++) {
		const image = folderWithImagesAndVideos.images[i];
		const r = await fetch(`/api/folders/${folder.id}/images/${image.id}/download`);

		const buffer = await r.arrayBuffer();

		zip.file(`${image.name}-${image.createdAt.getTime()}.${image.extension}`, buffer);

		sonnerToast(
			<div className="w-full">{ t('ongoing.title') }</div>,
			{
				id: "download-progress-toast",
				description: <div className="w-full">
					{ t('ongoing.description') }
					<Progress value={(i + 1) / totalFiles * 100} className="w-full mt-2" />
				</div>
			}
		)
	}

	for (let i = 0; i < folderWithImagesAndVideos.videos.length; i++) {
		const video = folderWithImagesAndVideos.videos[i];
		const r = await fetch(`/api/folders/${folder.id}/videos/${video.id}/download`);

		const buffer = await r.arrayBuffer();

		zip.file(`${video.name}-${video.createdAt.getTime()}.${video.extension}`, buffer);

		sonnerToast(
			<div className="w-full">{ t('ongoing.title') }</div>,
			{
				id: "download-progress-toast",
				description: <div className="w-full">
					{ t('ongoing.description') }
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

export const getSortedFolderContent = (folderContent: FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments, sort: ImagesSortMethod): FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments => {
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

export const getSortedImagesVideosContent = (arr: (Image | Video)[], sort: ImagesSortMethod): (Image | Video)[] => {
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
		default:
			return arr;
	}
}

export const validateShareToken = async (folderId: string, token: string, type: "accessToken" | "personAccessToken", hashedPinCode?: string | null): Promise<{ error: string | null, folder: (FolderWithCreatedBy & FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments & FolderWithAccessToken) | null, permission?: FolderTokenPermission }> => {
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
						videos: {
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
						videos: {
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