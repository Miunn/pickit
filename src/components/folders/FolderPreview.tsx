import fs from "fs";
import FolderPreviewClient from "@/components/folders/FolderPreviewClient";
import { FolderWithAccessToken, FolderWithCover, FolderWithImagesCount, FolderWithLocked } from "@/lib/definitions";

export default function FolderPreview({folder, locale}: { folder: FolderWithAccessToken & FolderWithImagesCount & FolderWithCover & FolderWithLocked, locale: string }) {

    function getFile() {
        try {
            return folder.cover ? fs.readFileSync(process.cwd() + "/" + folder.cover.path) : "";
        } catch (e) {
            return "";
        }
    }

    const file = getFile();
    const base = `data:image/png;base64,${file.toString('base64')}`;

    return (
        <FolderPreviewClient
            folder={folder}
            locale={locale}
            coverB64={base}
        />
    )
}
