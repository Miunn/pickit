import { ContextFile, useFilesContext } from "@/context/FilesContext";
import { useTranslations } from "next-intl";
import { Fragment, useMemo, useRef } from "react";
import { ImagePreviewGrid } from "./ImagePreviewGrid";
import { X } from "lucide-react";

export default function RecentlyAdded({
  onClickImage,
}: {
  onClickImage: (file: ContextFile) => void;
}) {
  const { files } = useFilesContext();
  const t = useTranslations("images");
  const recentRef = useRef<HTMLDivElement>(null);

  const newFiles = useMemo(() => {
    return files.filter((file) => {
      const now = new Date();
      const fileDate = new Date(file.createdAt);
      const diffTime = Math.abs(now.getTime() - fileDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    });
  }, [files]);

  return (
    <>
      {newFiles.length > 0 && (
        <div ref={recentRef}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">{t("newFiles")}</h2>
            <button
              onClick={() => {
                recentRef.current?.remove();
              }}
              className="mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <hr className="mt-1 mb-5" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:grid-cols-[repeat(auto-fill,16rem)] justify-items-start gap-3 sm:gap-2 mx-auto mb-3">
            {newFiles.map((file) => (
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
