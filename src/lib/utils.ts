import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { saveAs } from "file-saver";
import { Folder, FolderTokenPermission } from "@prisma/client";
import { FolderWithAccessToken, FolderWithImages, FolderWithImagesWithFolder, UploadImagesFormSchema } from "./definitions";
import { z } from "zod";
import { uploadImages } from "@/actions/images";
import { toast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";
import { prisma } from "./prisma";
import * as bcrypt from "bcryptjs";

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
	url = url.replace(/\/[a-z]{2}\//, "/");

	if (url.startsWith("/")) {
		return `/${locale}${url}`;
	}

	return `/${locale}/${url}`;
}

export const validateShareToken = async (token: string, type: "accessToken" | "personAccessToken", folderId: string, hashedPinCode?: string | null): Promise<{ error: string | null, folder: (FolderWithImagesWithFolder & FolderWithAccessToken) | null, permission?: FolderTokenPermission }> => {
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
								folder: true
							}
						},
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
								folder: true
							}
						},
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
		return { error: "unauthorized", folder: null };
	}

	if (accessToken.locked && !hashedPinCode) {
		return { error: "code-needed", folder: null };
	}

	if (accessToken.locked) {
		if (!hashedPinCode) {
			return { error: "unauthorized", folder: null };
		}

		const match = bcrypt.compareSync(accessToken.pinCode as string, hashedPinCode);

		if (!match) {
			return { error: "unauthorized", folder: null };
		}
	}

	return { error: null, folder: {...accessToken.folder, AccessToken: []}, permission: accessToken.permission };
}

export const handleImagesSubmission = async (
	setUploading: React.Dispatch<React.SetStateAction<boolean>>,
	data: z.infer<typeof UploadImagesFormSchema>,
	uploadForm: UseFormReturn<{ images?: any; }, any, undefined>,
	folderId: string,
	shareToken?: string | null,
	tokenType?: "accessToken" | "personAccessToken" | null,
	pinCode?: string | null): Promise<boolean> => {
	setUploading(true);

	if (!data.images || data.images!.length === 0) {
		return false;
	}

	const formData = new FormData();

	for (let i = 0; i < data.images!.length; i++) {
		formData.append(`image-${i}`, data.images![i]);
	}

	const r = await uploadImages(folderId, formData, shareToken, tokenType, pinCode);

	setUploading(false);

	if (r.error) {
		toast({
			title: "Error",
			description: r.error,
			variant: "destructive"
		})
		return false;
	}

	uploadForm.reset();
	toast({
		title: "Images uploaded",
		description: "The images were uploaded successfully."
	});

	return true;
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function computeUsedStorage(folders: FolderWithImages[]): number {
	return folders.reduce((acc, folder) => acc + folder.images.reduce((acc, image) => acc + image.size, 0), 0)
}