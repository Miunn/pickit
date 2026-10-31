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
import { abortFileUpload, initiateFileUpload, finalizeFileUpload } from "@/actions/files";
import { Progress } from "@/components/ui/progress";
import { ContextFile } from "@/context/FilesContext";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notifyAboutUpload } from "@/actions/accessTokens";
import { useSearchParams } from "next/navigation";
import SparkMD5 from "spark-md5";
import exifr from "exifr";

async function md5Base64(file: File) {
	const spark = new SparkMD5.ArrayBuffer();
	const reader = file.stream().getReader();

	for (;;) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		spark.append(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
	}

	return btoa(spark.end(true));
}

function putFile(url: string, file: File, onProgress: (loaded: number) => void) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url);
		xhr.setRequestHeader("Content-Type", file.type);
		xhr.upload.onprogress = event => {
			if (event.lengthComputable) {
				onProgress(event.loaded);
			}
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
				return;
			}
			reject(new Error(`Storage upload failed (${xhr.status})`));
		};
		xhr.onerror = () => reject(new Error("Storage upload failed"));
		xhr.send(file);
	});
}

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
			const loadedBytes = new Map<File, number>();
			const totalBytes = data.images.reduce((sum: number, file: File) => sum + file.size, 0);
			const shareToken = searchParams.get("share") ?? undefined;
			const shareKey = searchParams.get("h") ?? undefined;
			const reportProgress = () => {
				const loaded = [...loadedBytes.values()].reduce((sum, value) => sum + value, 0);
				toast(
					<div className="w-full">
						{t("ongoing.title", {
							current: uploadedCount,
							total: data.images.length,
						})}
						<Progress
							value={totalBytes === 0 ? 0 : (loaded / totalBytes) * 100}
							className="w-full mt-2"
						/>
					</div>,
					{ id: "progress-toast" }
				);
			};
			const results = await Promise.all(
				data.images.map(async (file: File) => {
					let verificationToken: string | undefined;
					let sentToStorage = false;
					try {
						const clientGps = file.type.startsWith("image/")
							? await exifr.gps(file).catch(() => undefined)
							: undefined;

						const checksum = await md5Base64(file);

						const verificationResult = await initiateFileUpload(
							{
								name: file.name,
								size: file.size,
								type: file.type,
								md5: checksum,
							},
							folderId,
							shareToken,
							shareKey
						);

						if (verificationResult.error || !verificationResult.uploadUrl || !verificationResult.verificationToken) {
							throw new Error(verificationResult.error || "No upload URL received");
						}

						verificationToken = verificationResult.verificationToken;

						await putFile(verificationResult.uploadUrl, file, loaded => {
							loadedBytes.set(file, loaded);
							reportProgress();
						});
						sentToStorage = true;
						loadedBytes.set(file, file.size);
						reportProgress();

						const finalizeResult = await finalizeFileUpload(
							verificationToken,
							folderId,
							shareToken,
							shareKey,
							typeof clientGps?.latitude === "number" &&
								typeof clientGps?.longitude === "number"
								? {
										latitude: clientGps.latitude,
										longitude: clientGps.longitude,
									}
								: undefined
						);

						if (finalizeResult.error) {
							throw new Error(finalizeResult.error);
						}

						uploadedCount += 1;
						reportProgress();
						return {
							success: true,
							file: finalizeResult.file,
						};
					} catch (error) {
						console.error(`Error uploading ${file.name}:`, error);
						toast.error(t("errors.uploading-failed", { name: file.name }));
						if (verificationToken && !sentToStorage) {
							await abortFileUpload(verificationToken, folderId, shareToken, shareKey).catch(
								() => undefined
							);
						}
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
