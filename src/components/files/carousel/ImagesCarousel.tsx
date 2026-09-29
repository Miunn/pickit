import { useEffect, useMemo, useState } from "react";
import {
	Carousel,
	CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { MessageCircle, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, formatBytes, getFileSrc } from "@/lib/utils";
import ImageCommentSection from "@/components/files/carousel/ImageCommentSection";
import { useSearchParams } from "next/navigation";
import EditDescriptionDialog from "@/components/files/dialogs/EditDescriptionDialog";
import { FileType } from "@prisma/client";
import LoadingImage from "@/components/files/LoadingImage";
import FileOptions from "@/components/files/carousel/FileOptions";
import { ContextFile, useFilesContext } from "@/context/FilesContext";
import FileLikeButton from "@/components/files/FileLikeButton";
import TagChip from "@/components/tags/TagChip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "@/lib/auth-client";

export default function ImagesCarousel({ startIndex }: { readonly startIndex: number }) {
	const { sortedFiles, files, setFiles } = useFilesContext();
	const searchParams = useSearchParams();
	const shareToken = searchParams.get("share");
	const shareHashPin = searchParams.get("h");
	const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

	const { data: session } = useSession();

	const t = useTranslations("components.images.carousel");
	const [carouselApi, setCarouselApi] = useState<CarouselApi>();
	const [currentIndex, setCurrentIndex] = useState<number>(startIndex);

	const mediaClassName =
		"max-h-full max-w-full w-auto h-auto object-contain rounded-md transition-all duration-300 ease-in-out";
	const navButtonClassName =
		"top-1/2 z-20 size-10 border bg-background shadow-md backdrop-blur-sm disabled:opacity-100";

	const currentFile = useMemo<ContextFile | undefined>(() => {
		return sortedFiles[currentIndex];
	}, [currentIndex, sortedFiles]);

	const isFolderOwner = useMemo(() => {
		return session?.user.id === currentFile?.folder.createdById;
	}, [session, currentFile]);

	useEffect(() => {
		if (!carouselApi) return;

		setCurrentIndex(carouselApi.selectedScrollSnap());

		carouselApi.on("select", () => {
			setCurrentIndex(carouselApi.selectedScrollSnap());
		});
	}, [carouselApi, setCurrentIndex]);

	return (
		<div className={"w-full p-2 mx-auto"}>
			<div className="max-w-full flex justify-between items-center mb-2 gap-2 px-2">
				<div className="font-semibold truncate flex items-center gap-3">
					<p className="truncate">{currentFile?.name}</p>
					{currentFile && currentFile?.tags.length > 0 ? (
						<div className="flex gap-1">
							<TagChip tag={currentFile?.tags[0]} />
							{currentFile?.tags.length > 1 && (
								<TooltipProvider>
									<Tooltip delayDuration={0}>
										<TooltipTrigger asChild>
											<TagChip
												tag={{
													id: "more",
													name: `+${currentFile?.tags.length - 1}`,
													color: currentFile
														?.tags[1]
														.color,
													createdAt: new Date(),
													updatedAt: new Date(),
													folderId: currentFile?.folderId,
													userId: currentFile?.createdById,
												}}
											/>
										</TooltipTrigger>
										<TooltipContent>
											<p className="text-sm capitalize truncate">
												{currentFile?.tags
													.slice(1)
													.map(
														tag =>
															tag.name
													)
													.join(", ")}
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					) : null}
				</div>
				{currentFile ? (
					<FileOptions
						file={currentFile}
						currentIndex={currentIndex}
						carouselApi={carouselApi}
					/>
				) : null}
			</div>
			<Carousel
				className="relative w-full h-[80vh] mx-auto mb-2"
				opts={{
					align: "center",
					loop: true,
					startIndex: startIndex,
					inViewThreshold: 0.5,
				}}
				setApi={setCarouselApi}
			>
				<CarouselContent className="h-full">
					{sortedFiles.map(file => (
						<CarouselItem key={file.id} className="h-full">
							<div className="relative flex h-full w-full items-center justify-center px-14">
								{file.type === FileType.VIDEO ? (
									<video
										className={mediaClassName}
										controls
										src={getFileSrc(file, "original", {
											share: shareToken,
											h: shareHashPin,
											t: tokenType === "personAccessToken" ? "p" : "a",
										})}
									>
										<track kind="captions" />
									</video>
								) : (
									<LoadingImage
										src={getFileSrc(file, "original", {
											share: shareToken,
											h: shareHashPin,
											t: tokenType === "personAccessToken" ? "p" : "a",
										})}
										alt={file.name}
										className={mediaClassName}
										width={1920}
										height={1080}
										spinnerClassName="w-10 h-10 text-primary"
									/>
								)}
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className={cn(navButtonClassName, "left-3")} />
				<CarouselNext className={cn(navButtonClassName, "right-3")} />
			</Carousel>
			<div className="w-full grid grid-cols-2 items-center px-2">
				<p className="truncate">{currentFile?.folder.name}</p>
				<p className="text-sm text-muted-foreground text-nowrap text-end justify-self-end">
					<span className="hidden sm:inline-block">{`${currentFile?.width}x${currentFile?.height}`}</span>{" "}
					<span className="hidden sm:inline-block">-</span>{" "}
					<span className="hidden sm:inline-block">{`${formatBytes(currentFile?.size || 0, { decimals: 2 })}`}</span>{" "}
					<span className="hidden sm:inline-block">-</span>{" "}
					<span>
						{t("slide", {
							current: currentIndex + 1,
							total: sortedFiles.length,
						})}
					</span>
				</p>
			</div>

			<div className="w-full px-2 py-2 flex justify-between items-start gap-4">
				<p
					className={cn(
						"text-sm text-muted-foreground flex-1 whitespace-pre-wrap line-clamp-5",
						currentFile?.description ? "" : "italic"
					)}
				>
					{currentFile?.description || t("noDescription")}
				</p>

				{currentFile ? (
					<div className="flex items-center gap-2">
						<FileLikeButton file={currentFile} />

						<div className="flex items-center gap-0.5">
							<p className="text-sm text-muted-foreground">
								{currentFile?.comments.length || 0}
							</p>
							<ImageCommentSection file={currentFile}>
								<Button
									variant={"ghost"}
									size={"icon"}
									type="button"
									className="size-7 p-0 rounded-full hover:bg-primary/20"
								>
									<MessageCircle className="size-4" />
								</Button>
							</ImageCommentSection>
						</div>

						{isFolderOwner ? (
							<EditDescriptionDialog
								file={currentFile}
								onSuccess={description => {
									setFiles(
										files.map(file => {
											if (
												file.id ===
												currentFile.id
											) {
												return {
													...file,
													description:
														description,
												};
											}
											return file;
										})
									);
								}}
							>
								<Button
									variant={"ghost"}
									size={"icon"}
									type="button"
									className="size-7 p-0 rounded-full hover:bg-primary/20"
								>
									<Pencil className="size-4" />
								</Button>
							</EditDescriptionDialog>
						) : null}
					</div>
				) : null}
			</div>
		</div>
	);
}
