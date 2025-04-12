'use client'

import { UploadImagesFormSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { FileUploader } from "../generic/FileUploader";
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner"
import { initiateImageUpload, finalizeImageUpload } from "@/actions/images";
import { Progress } from "../ui/progress";
import { formatBytes } from "@/lib/utils";
import { useState } from "react";

interface UploadImagesFormProps {
    folderId: string;
    onUpload?: () => void;
}

interface InitiateUploadResult {
    error: string | null;
    uploadUrl: string | null;
    verificationToken?: string;
    fileId?: string;
}

interface FinalizeUploadResult {
    error: string | null;
    fileId: string | null;
}

export function UploadImagesForm({ folderId, onUpload }: UploadImagesFormProps) {
    const t = useTranslations("components.images.uploadImagesForm");
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const uploadImageForm = useForm<z.infer<typeof UploadImagesFormSchema>>({
        resolver: zodResolver(UploadImagesFormSchema),
        defaultValues: {
            images: []
        }
    });

    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    
    const onSubmit = async (data: z.infer<typeof UploadImagesFormSchema>) => {
        if (!data.images || data.images.length === 0) return;

        setIsUploading(true);
        const progressToast = toast.loading("Preparing upload...");

        try {
            const results = await Promise.all(
                data.images.map(async (file: File) => {
                    try {
                        // Step 1: Prepare file samples
                        const sampleSize = 1024 * 1024; // 1MB
                        const samples = [];
                        const fileBuffer = await file.arrayBuffer();
                        
                        for (let i = 0; i < fileBuffer.byteLength; i += sampleSize) {
                            const chunk = fileBuffer.slice(i, Math.min(i + sampleSize, fileBuffer.byteLength));
                            const hashBuffer = await crypto.subtle.digest('SHA-256', chunk);
                            const hashArray = Array.from(new Uint8Array(hashBuffer));
                            const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
                            samples.push(hashBase64);
                        }

                        // Step 2: Send metadata and samples to get verification URL
                        const verificationFormData = new FormData();
                        verificationFormData.append("fileName", file.name);
                        verificationFormData.append("fileSize", file.size.toString());
                        verificationFormData.append("fileType", file.type);
                        verificationFormData.append("fileSamples", JSON.stringify(samples));

                        const verificationResult = await initiateImageUpload(verificationFormData, folderId) as InitiateUploadResult;
                        
                        if (verificationResult.error) {
                            throw new Error(verificationResult.error);
                        }

                        if (!verificationResult.uploadUrl) {
                            throw new Error("No upload URL received");
                        }

                        // Step 3: Upload the file
                        const uploadResponse = await fetch(verificationResult.uploadUrl, {
                            method: "PUT",
                            body: file,
                            headers: {
                                "Content-Type": file.type
                            }
                        });

                        if (!uploadResponse.ok) {
                            throw new Error("Upload failed");
                        }

                        // Step 4: Finalize the upload
                        const finalizeFormData = new FormData();
                        finalizeFormData.append("verificationToken", verificationResult.verificationToken || "");
                        finalizeFormData.append("fileId", verificationResult.fileId || "");

                        const finalizeResult = await finalizeImageUpload(finalizeFormData, folderId) as FinalizeUploadResult;

                        if (finalizeResult.error) {
                            throw new Error(finalizeResult.error);
                        }

                        return {
                            success: true,
                            file: file.name
                        };
                    } catch (error) {
                        console.error(`Error uploading ${file.name}:`, error);
                        return {
                            success: false,
                            file: file.name,
                            error: error instanceof Error ? error.message : "Unknown error"
                        };
                    }
                })
            );

            const successfulUploads = results.filter(r => r.success);
            const failedUploads = results.filter(r => !r.success);

            if (successfulUploads.length > 0) {
                toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
            }

            if (failedUploads.length > 0) {
                toast.error(`Failed to upload ${failedUploads.length} file(s)`);
            }

            setFiles([]);
            setShowUploadModal(false);
            if (onUpload) {
                onUpload();
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An error occurred during upload");
        } finally {
            setIsUploading(false);
            toast.dismiss(progressToast);
        }
    };

    return (
        <Form {...uploadImageForm}>
            <form onSubmit={uploadImageForm.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={uploadImageForm.control}
                    name="images"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem className="max-w-[443px]">
                            <FormLabel>{t('label')}</FormLabel>
                            <FormControl>
                                <FileUploader
                                    multiple={true}
                                    maxSize={1024 * 1024 * 1000}
                                    maxFileCount={999}
                                    accept={{
                                        'image/png': ['.png'],
                                        'image/jpeg': ['.jpg', '.jpeg'],
                                        'image/gif': ['.gif'],
                                        'image/webp': ['.webp'],
                                        'video/x-msvideo': ['.avi'],
                                        'video/mp4': ['.mp4', '.MP4'],
                                        'video/quicktime': ['.mov'],
                                        'video/mpeg': ['.mpg', '.mpeg'],
                                        'video/x-flv': ['.flv'],
                                        'video/*': ['.webm']
                                    }}
                                    onValueChange={(files) => onChange(files)}
                                    {...fieldProps}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {uploadImageForm.formState.isSubmitting
                    ? <Button className="ml-auto flex" type="button" disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('actions.submitting')}</Button>
                    : <Button className="ml-auto flex" type="submit">{t('actions.submit')}</Button>
                }
            </form>
        </Form>
    )
}