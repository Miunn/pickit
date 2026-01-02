import { Braces, Check, Copy, Download, Ellipsis, Expand, ExternalLink, Tags } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { Button } from "@/components/ui/button";
import FullScreenImageCarousel from "./FullScrenImageCarousel";
import Link from "next/link";
import { copyImageToClipboard } from "@/lib/utils";
import { FileWithTags, FolderWithTags } from "@/lib/definitions";
import { toast } from "@/hooks/use-toast";
import { FileType, FolderTag } from "@prisma/client";
import { useState } from "react";
import ImageExif from "../ImageExif";
import { CarouselApi } from "@/components/ui/carousel";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ManageTagsDialog from "../dialogs/ManageTagsDialog";
import { useSession } from "@/providers/SessionProvider";
import { ContextFile, useFilesContext } from "@/context/FilesContext";
import { addTagsToFile, removeTagsFromFile } from "@/actions/tags";
import { useTopLoader } from "nextjs-toploader";

/**
 * Render action controls for a file including tag management, fullscreen carousel, open-in-new-tab, download, copy-to-clipboard, and metadata actions.
 *
 * @param file - The file (with its folder and tags) for which actions are rendered.
 * @param currentIndex - Initial index to open the fullscreen carousel at.
 * @param carouselApi - Carousel API instance used to control the parent carousel.
 * @returns The JSX element containing the file action controls.
 */
export default function FileOptions({
    file,
    currentIndex,
    carouselApi,
}: {
    readonly file: { folder: FolderWithTags } & FileWithTags;
    readonly currentIndex: number;
    readonly carouselApi: CarouselApi;
}) {
    const { user } = useSession();
    const { setFiles } = useFilesContext();
    const { done } = useTopLoader();
    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");
    const tokenType = searchParams.get("t") === "p" ? "personAccessToken" : "accessToken";

    const t = useTranslations("components.images.carousel.actions");
    const [copied, setCopied] = useState(false);

    const handleTagSelected = async (tag: FolderTag): Promise<boolean> => {
        setFiles((prev: ContextFile[]) => {
            return prev.map(f => (f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f));
        });
        const result = await addTagsToFile(file.id, [tag.id]);
        if (!result.success) {
            sonnerToast.error(t("addTag.errorAdd"));

            setFiles((prev: ContextFile[]) => {
                return prev.map(f => (f.id === file.id ? { ...f, tags: f.tags.filter(t => t.id !== tag.id) } : f));
            });
        }

        return result.success;
    };

    const handleTagUnselected = async (tag: FolderTag) => {
        setFiles(prev => prev.map(f => (f.id === file.id ? { ...f, tags: f.tags.filter(t => t.id !== tag.id) } : f)));
        const result = await removeTagsFromFile(file.id, [tag.id]);
        if (!result.success) {
            sonnerToast.error(t("addTag.errorRemove"));
            setFiles(prev => prev.map(f => (f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f)));
        }

        return result.success;
    };

    const handleTagAdded = async (tag: FolderTag) => {
        setFiles((prev: ContextFile[]) => prev.map(f => (f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f)));

        const r = await handleTagSelected(tag);

        if (!r) {
            setFiles(prev => prev.map(f => (f.id === file.id ? { ...f, tags: [...f.tags, tag] } : f)));
        }

        return r;
    };

    return (
        <>
            <div className="hidden sm:flex gap-2">
                {user?.id === file.createdById && (
                    <ManageTagsDialog
                        selectedTags={file.tags}
                        onTagSelected={handleTagSelected}
                        onTagUnselected={handleTagUnselected}
                        onTagAdded={handleTagAdded}
                    >
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Tags className="w-4 h-4" />
                        </Button>
                    </ManageTagsDialog>
                )}
                <FullScreenImageCarousel defaultIndex={currentIndex} parentCarouselApi={carouselApi}>
                    <Button variant={"outline"} size={"icon"} type="button">
                        <Expand className="w-4 h-4" />
                    </Button>
                </FullScreenImageCarousel>
                <Button variant={"outline"} size={"icon"} type="button" asChild>
                    <Link
                        href={`/api/folders/${file.folderId}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                        target="_blank"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                </Button>
                <Button
                    variant={"outline"}
                    size={"icon"}
                    type="button"
                    onClick={() => {
                        toast({
                            title: t("download.started"),
                            description: t("download.description", { name: file.name }),
                        });
                        setTimeout(() => {
                            done();
                        }, 1000);
                    }}
                    asChild
                >
                    <a
                        href={`/api/folders/${file.folder.id}/${file.type === FileType.VIDEO ? "videos" : "images"}/${file.id}/download?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                        download
                    >
                        <Download className="w-4 h-4" />
                    </a>
                </Button>
                <Button
                    className={file.type === FileType.VIDEO ? "hidden" : ""}
                    variant={"outline"}
                    size={"icon"}
                    type="button"
                    onClick={async () => {
                        if (file.type === FileType.VIDEO) {
                            toast({
                                title: t("copy.errors.video-copy-unavailable.title"),
                                description: t("copy.errors.video-copy-unavailable.description"),
                                variant: "destructive",
                            });
                            return;
                        }
                        await copyImageToClipboard(
                            file.folderId || "",
                            file.id || "",
                            shareToken || "",
                            shareHashPin || "",
                            tokenType
                        );

                        setCopied(true);
                        toast({
                            title: t("copy.success.title"),
                            description: t("copy.success.description"),
                            duration: 2000,
                        });

                        setTimeout(() => {
                            setCopied(false);
                        }, 2000);
                    }}
                    disabled={copied}
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <div className="hidden sm:block">
                    <ImageExif image={file}>
                        <Button variant={"outline"} size={"icon"} type="button">
                            <Braces className="w-4 h-4" />
                        </Button>
                    </ImageExif>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger className="sm:hidden" asChild>
                    <Button variant="outline" size="icon">
                        <Ellipsis className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {user?.id === file.createdById && (
                        <DropdownMenuItem
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                            }}
                        >
                            <ManageTagsDialog
                                selectedTags={file.tags}
                                onTagSelected={handleTagSelected}
                                onTagUnselected={handleTagUnselected}
                                onTagAdded={handleTagAdded}
                            >
                                <div className="w-full flex items-center">
                                    <Tags size={16} className="opacity-60 mr-2" aria-hidden="true" />
                                    {t("manageTags")}
                                </div>
                            </ManageTagsDialog>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={e => e.stopPropagation()}>
                        <FullScreenImageCarousel defaultIndex={currentIndex} parentCarouselApi={carouselApi}>
                            <div className="w-full flex items-center">
                                <Expand size={16} className="opacity-60 mr-2" aria-hidden="true" />
                                {t("expand")}
                            </div>
                        </FullScreenImageCarousel>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/api/folders/${file.folderId}/images/${file.id}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`}
                            target="_blank"
                        >
                            <ExternalLink size={16} className="opacity-60 mr-2" aria-hidden="true" />
                            {t("openInNew")}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            toast({
                                title: t("download.started"),
                                description: t("download.description", { name: file.name }),
                            });
                            setTimeout(() => {
                                done();
                            }, 1000);
                        }}
                        asChild
                    >
                        <a
                            href={`/api/folders/${file.folder.id}/${file.type === FileType.VIDEO ? "videos" : "images"}/${file.id}/download`}
                            download
                        >
                            {t("download.label")}
                        </a>
                    </DropdownMenuItem>
                    {file.type === FileType.VIDEO ? null : (
                        <DropdownMenuItem
                            onClick={async () => {
                                if (file.type === FileType.VIDEO) {
                                    toast({
                                        title: t("copy.errors.video-copy-unavailable.title"),
                                        description: t("copy.errors.video-copy-unavailable.description"),
                                        variant: "destructive",
                                    });
                                    return;
                                }
                                await copyImageToClipboard(
                                    file.folderId || "",
                                    file.id || "",
                                    shareToken || "",
                                    shareHashPin || "",
                                    tokenType
                                );

                                setCopied(true);
                                toast({
                                    title: t("copy.success.title"),
                                    description: t("copy.success.description"),
                                    duration: 2000,
                                });

                                setTimeout(() => {
                                    setCopied(false);
                                }, 2000);
                            }}
                        >
                            {copied ? (
                                <Check size={16} className="opacity-60 mr-2" aria-hidden="true" />
                            ) : (
                                <Copy size={16} className="opacity-60 mr-2" aria-hidden="true" />
                            )}
                            {t("copy.title")}
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                        <button onClick={e => e.stopPropagation()}>
                            <ImageExif image={file}>
                                <div className="w-full flex items-center">
                                    <Braces size={16} className="opacity-60 mr-2" aria-hidden="true" />
                                    {t("metadata")}
                                </div>
                            </ImageExif>
                        </button>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
