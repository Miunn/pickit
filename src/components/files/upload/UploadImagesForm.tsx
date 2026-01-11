"use client";

import { UploadImagesFormSchema } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUploader } from "@/components/files/FileUploader";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { initiateFileUpload, finalizeFileUpload } from "@/actions/files";
import { Progress } from "@/components/ui/progress";
import { ContextFile } from "@/context/FilesContext";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notifyAboutUpload } from "@/actions/accessTokens";
import { useSearchParams } from "next/navigation";
import crypto from "crypto";

interface UploadImagesFormProps {
	readonly folderId: string;
	readonly onUpload?: (files: ContextFile[]) => void;
	readonly shouldDisplayNotify?: boolean;
}

export function UploadImagesForm({ folderId, onUpload, shouldDisplayNotify = true }: UploadImagesFormProps) {
	const t = useTranslations("components.images.uploadImagesForm");
	const searchParams = useSearchParams();

	const uploadImageForm = useForm<z.infer<typeof UploadImagesFormSchema>>({
		resolver: zodResolver(UploadImagesFormSchema),
		defaultValues: {
			images: [],
			shouldNotify: true,
		},
	});

	const onSubmit = async (data: z.infer<typeof UploadImagesFormSchema>) => {
		if (!data.images || data.images.length === 0) return;

		toast(
			<div className="w-full">
				{t("ongoing.title", { current: 0, total: data.images.length })}
				<Progress value={0} className="w-full mt-2" />
			</div>,
			{
				id: "progress-toast",
				duration: Infinity,
				classNames: {
					content: "w-full",
					title: "w-full",
				},
			}
		);

		try {
			let uploadedCount = 0;
			const results = await Promise.all(
				data.images.map(async (file: File) => {
					try {
						// Step 1: Compute CRC32C checksum
						const fileArrayBuffer = await file.arrayBuffer();
						const fileBuffer = Buffer.from(fileArrayBuffer);
						const checksum = crypto
							.createHash("md5")
							.update(fileBuffer)
							.digest("base64");
						console.log("Sended metadata checksum", {
							name: file.name,
							size: file.size,
							type: file.type,
							md5: checksum,
						});

						// Step 2: Send metadata and samples to get verification URL
						const verificationResult = await initiateFileUpload(
							{
								name: file.name,
								size: file.size,
								type: file.type,
								md5: checksum,
							},
							folderId,
							searchParams.get("share") ?? undefined,
							searchParams.get("h") ?? undefined
						);

						if (verificationResult.error) {
							toast.error(t("errors.uploading-failed", { name: file.name }));
							throw new Error(verificationResult.error);
						}

						if (!verificationResult.uploadUrl) {
							toast.error(t("errors.uploading-failed", { name: file.name }));
							throw new Error("No upload URL received");
						}

						if (!verificationResult.verificationToken) {
							toast.error(t("errors.uploading-failed", { name: file.name }));
							throw new Error("No verification token received");
						}

						// Step 3: Upload the file
						const uploadResponse = await fetch(verificationResult.uploadUrl, {
							method: "PUT",
							body: file,
							headers: {
								"Content-Type": file.type,
							},
						});

						if (!uploadResponse.ok) {
							throw new Error("Upload failed");
						}

						// Step 4: Finalize the upload
						const finalizeResult = await finalizeFileUpload(
							verificationResult.verificationToken,
							folderId,
							searchParams.get("share") ?? undefined,
							searchParams.get("h") ?? undefined
						);

						if (finalizeResult.error) {
							throw new Error(finalizeResult.error);
						}

						uploadedCount += 1;
						toast(
							<div className="w-full">
								{t("ongoing.title", {
									current: uploadedCount,
									total: data.images.length,
								})}
								<Progress
									value={
										(uploadedCount / data.images.length) *
										100
									}
									className="w-full mt-2"
								/>
							</div>,
							{
								id: "progress-toast",
							}
						);
						return {
							success: true,
							file: finalizeResult.file,
						};
					} catch (error) {
						console.error(`Error uploading ${file.name}:`, error);
						return {
							success: false,
							file: null,
							error: error instanceof Error ? error.message : "Unknown error",
						};
					}
				})
			);

			const successfulUploads = results.filter(r => r.success);

			setTimeout(() => {
				toast.dismiss("progress-toast");
			}, 2000);

			if (data.shouldNotify && successfulUploads.length > 0) {
				await notifyAboutUpload(folderId, successfulUploads.length);
			}

			toast.success(t("success", { count: successfulUploads.length }));

			onUpload?.(successfulUploads.map(r => r.file));
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
					render={({ field: { /*value,*/ onChange, ...fieldProps } }) => (
						<FormItem className="max-w-[443px]">
							<FormLabel>{t("label")}</FormLabel>
							<FormControl>
								<FileUploader
									multiple={true}
									maxSize={1024 * 1024 * 1000}
									maxFileCount={999}
									accept={{
										"image/png": [".png"],
										"image/jpeg": [".jpg", ".jpeg"],
										"image/gif": [".gif"],
										"image/webp": [".webp"],
										"video/x-msvideo": [".avi"],
										"video/mp4": [".mp4", ".MP4"],
										"video/quicktime": [".mov"],
										"video/mpeg": [".mpg", ".mpeg"],
										"video/x-flv": [".flv"],
										"video/*": [".webm"],
									}}
									onValueChange={files => onChange(files)}
									{...fieldProps}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-between">
					{shouldDisplayNotify ? (
						<div className="flex items-center gap-2">
							<Switch
								id="shouldNotify"
								checked={uploadImageForm.watch("shouldNotify")}
								onCheckedChange={checked =>
									uploadImageForm.setValue(
										"shouldNotify",
										checked
									)
								}
							/>
							<Label className="max-w-[200px]" htmlFor="shouldNotify">
								{t("shouldNotify")}
							</Label>
						</div>
					) : null}
					{uploadImageForm.formState.isSubmitting ? (
						<Button className="ml-auto flex" type="button" disabled>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
							{t("actions.submitting")}
						</Button>
					) : (
						<Button className="ml-auto flex" type="submit">
							{t("actions.submit")}
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}
