import { getTranslations } from "next-intl/server";
import FolderActionBar from "./FolderActionBar";

export default async function FolderHeader({
    folderName,
    folderCreatedByName,
    isGuest,
}: {
    folderName: string;
    folderCreatedByName: string;
    isGuest: boolean;
}) {
    const t = await getTranslations("folders");

    return (
        <h3 className={"mb-2 flex justify-between items-center"}>
            <p className="font-semibold">
                {folderName}{" "}
                {isGuest ? (
                    <span className="font-normal text-sm">- {t("sharedBy", { name: folderCreatedByName })}</span>
                ) : null}
            </p>

            <FolderActionBar />
        </h3>
    );
}
