'use client'

import { UploadImagesFormSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUploader } from "@/components/files/FileUploader";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner"
import { initiateFileUpload, finalizeFileUpload } from "@/actions/files";
import { Progress } from "@/components/ui/progress";
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

    const uploadImageForm = useForm<z.infer<typeof UploadImagesFormSchema>>({
        resolver: zodResolver(UploadImagesFormSchema),
        defaultValues: {
            images: []
        }
    });
    
    const onSubmit = async (data: z.infer<typeof UploadImagesFormSchema>) => {
        if (!data.images || data.images.length === 0) return;

        toast(
            <div className="w-full">
                {t('ongoing.title')}
                <Progress value={0} className="w-full mt-2" />
            </div>,
            {
                id: "progress-toast",
                duration: Infinity,
                classNames: {
                    content: "w-full",
                    title: "w-full"
                }
            }
        );

        try {
            const results = await Promise.all(
                data.images.map(async (file: File, i: number) => {
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

                        const verificationResult = await initiateFileUpload(verificationFormData, folderId) as InitiateUploadResult;
                        
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

                        const finalizeResult = await finalizeFileUpload(finalizeFormData, folderId) as FinalizeUploadResult;

                        if (finalizeResult.error) {
                            throw new Error(finalizeResult.error);
                        }

                        toast(
                            <div className="w-full">
                                {t('ongoing.title')}
                                <Progress value={Math.round(((i + 1) / data.images!.length) * 100)} className="w-full mt-2" />
                            </div>,
                            {
                                id: "progress-toast"
                            }
                        )
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

            setTimeout(() => {
                toast.dismiss("progress-toast");
            }, 2000);

            toast.success(t('success', { count: successfulUploads.length }));

            if (onUpload) {
                onUpload();
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An error occurred during upload");
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