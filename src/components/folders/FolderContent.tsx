"use client";

import { useTranslations } from "next-intl";
import { ViewState } from "@/components/folders/ViewSelector";
import ImagesList from "@/components/files/views/list/ImagesList";
import { useFolderContext } from "@/context/FolderContext";
import { useFilesContext } from "@/context/FilesContext";
import dynamic from "next/dynamic";
import FolderActionBar from "@/components/folders/actions/FolderActionBar";
import TagGroupedGrid from "@/components/files/views/grid/TagGroupedGrid";
import { useSession } from "@/lib/auth-client";

const ImagesGrid = dynamic(() => import("@/components/files/views/grid/ImagesGrid").then(mod => mod.ImagesGrid), {
	ssr: false,
});

export const FolderContent = () => {
	const { data: session } = useSession();
	const { folder } = useFolderContext();
	const { viewState } = useFilesContext();

	const t = useTranslations("folders");

	const renderContent = () => {
		switch (viewState) {
			case ViewState.List:
				return <ImagesList />;
			case ViewState.TagGrouped:
				return <TagGroupedGrid />;
			default:
				return <ImagesGrid />;
		}
	};

	return (
		<div>
			<h3 className={"mb-2 flex justify-between items-center"}>
				<p className="font-semibold">
					{folder.name}{" "}
					{!session ? (
						<span className="font-normal text-sm">
							- {t("sharedBy", { name: folder.createdBy.name })}
						</span>
					) : null}
				</p>

				<FolderActionBar />
			</h3>

			<div className="flex-1 overflow-visible">{renderContent()}</div>
		</div>
	);
};
