import { ContextFile, useFilesContext } from "@/context/FilesContext";
import { useTranslations } from "next-intl";
import { Fragment, useMemo, useState } from "react";
import { ImagePreviewGrid } from "./ImagePreviewGrid";
import { X } from "lucide-react";

/ **
 * Renders a "Recently Added" section showing files created within the last three days.
 *
 * The section includes a header with a close control that removes the section from the DOM,
 * a responsive grid of image previews, and a secondary header for album content. Each preview
 * delegates click events to the provided handler.
 *
 * @param onClickImage - Handler invoked with a file when its preview is clicked
 * @returns The component's element when recent files exist, otherwise renders nothing
 */
export default function RecentlyAdded({ onClickImage }: { onClickImage: (file: ContextFile) => void }) {
    const { files } = useFilesContext();
    const t = useTranslations("images");
    const [isVisible, setIsVisible] = useState(true);

    const newFiles = useMemo(() => {
        return files.filter(file => {
            const now = new Date();
            const fileDate = new Date(file.createdAt);
            const diffTime = Math.abs(now.getTime() - fileDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 3;
        });
    }, [files]);

    return (
        <>
            {isVisible && newFiles.length > 0 && (
                <div>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium">{t("newFiles")}</h2>
                        <button onClick={() => setIsVisible(false)} className="mr-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <hr className="mt-1 mb-5" />
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] justify-items-start gap-3 sm:gap-2 mx-auto mb-3">
                        {newFiles.map(file => (
                            <Fragment key={file.id}>
                                <ImagePreviewGrid
                                    file={file}
                                    selected={[]}
                                    onClick={() => onClickImage(file)}
                                    onSelect={() => {}}
                                />
                            </Fragment>
                        ))}
                    </div>

                    <h2 className="text-lg font-medium mt-8">{t("albumContent")}</h2>
                    <hr className="mt-1 mb-5" />
                </div>
            )}
        </>
    );
}