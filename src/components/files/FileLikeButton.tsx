import { useFilesContext } from "@/context/FilesContext";
import { Button } from "@/components/ui/button";
import { FileWithLikes } from "@/lib/definitions";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { likeFile } from "@/actions/files";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

/**
 * Renders a file's like count and a heart button that allows the current user to toggle their like for the file.
 *
 * When the current user is not allowed to like the file, shows a non-interactive heart with a tooltip explaining why.
 * When the user can like, clicking the heart invokes the like action, updates the files state in context to add or remove the corresponding like, and shows an error toast if the action fails.
 *
 * @param file - The file object including its current likes (FileWithLikes).
 * @returns The JSX element containing the like count and heart button.
 */
export default function FileLikeButton({ file }: { readonly file: FileWithLikes }) {
    const t = useTranslations("components.files.likeButton");
    const { files, setFiles, hasUserLikedFile, canUserLikeFile } = useFilesContext();

    const userLikedFile = useMemo(() => hasUserLikedFile(file.id), [hasUserLikedFile, file.id]);

    const searchParams = useSearchParams();
    const shareToken = searchParams.get("share");
    const shareHashPin = searchParams.get("h");

    const likeFileHandler = async () => {
        const result = await likeFile(file.id, shareToken, shareHashPin);

        if (result.error) {
            toast.error(result.error);
            return;
        }

        if (!result.like) {
            return;
        }

        if (!result.liked) {
            setFiles(
                files.map(fileState => {
                    if (fileState.id === file.id) {
                        return {
                            ...fileState,
                            likes: fileState.likes.filter(like => like.id !== result.like?.id),
                        };
                    }
                    return fileState;
                })
            );
            return;
        }

        setFiles(
            files.map(fileState => {
                if (fileState.id === file.id && result.like) {
                    return { ...fileState, likes: [...fileState.likes, result.like] };
                }
                return fileState;
            })
        );
    };

    if (!canUserLikeFile(file)) {
        return (
            <div className="flex items-center gap-0.5">
                <p className="text-sm text-muted-foreground">{file.likes.length}</p>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Button
                                    variant={"ghost"}
                                    size={"icon"}
                                    type="button"
                                    className="size-7 p-0 rounded-full hover:bg-muted"
                                    tabIndex={0}
                                    disabled
                                >
                                    <Heart className={"size-4 p-0"} fill={"none"} color={"currentColor"} />
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("cannotLike")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-0.5">
            <p className="text-sm text-muted-foreground">{file.likes.length}</p>
            <Button
                variant={"ghost"}
                size={"icon"}
                type="button"
                className="size-7 p-0 rounded-full hover:bg-primary/20"
                onClick={likeFileHandler}
            >
                <Heart
                    className={cn("size-4 p-0", userLikedFile ? "text-red-500" : "")}
                    fill={userLikedFile ? "red" : "none"}
                    color={userLikedFile ? "red" : "currentColor"}
                />
            </Button>
        </div>
    );
}
