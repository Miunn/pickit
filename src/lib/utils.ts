import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { saveAs } from "file-saver";
import { Folder } from "@prisma/client";
import { UploadImagesFormSchema } from "./definitions";
import { z } from "zod";
import { uploadImages } from "@/actions/images";
import { toast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number
    sizeType?: "accurate" | "normal"
  } = {}
) {
  const { decimals = 0, sizeType = "normal" } = opts

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"]
  if (bytes === 0) return "0 Byte"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "Bytes"
    }`
}

export const downloadFolder = async (folder: Folder): Promise<number> => {
  const res = await fetch(`/api/folders/${folder.id}/download`);

  if (!res || !res.ok) {
    console.log(res);
    console.log("Return status:", res.status);
    return res.status;
  }

  const blob = await res.blob();
  saveAs(blob, `${folder.name}.zip`);
  return 200;
}

export const handleImagesSubmission = async (
  setUploading: React.Dispatch<React.SetStateAction<boolean>>,
  data: z.infer<typeof UploadImagesFormSchema>,
  folderId: string,
  uploadForm: UseFormReturn<{ images?: any; }, any, undefined>): Promise<boolean> => {
  setUploading(true);

  if (!data.images || data.images!.length === 0) {
    return false;
  }

  const formData = new FormData();

  for (let i = 0; i < data.images!.length; i++) {
    formData.append(`image-${i}`, data.images![i]);
  }

  const r = await uploadImages(folderId, data.images!.length, formData)

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
