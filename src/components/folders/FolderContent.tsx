"use client";

import { useTranslations } from "next-intl";
import { ViewState } from "./ViewSelector";
import ImagesList from "../files/views/list/ImagesList";
import { useFolderContext } from "@/context/FolderContext";
import { useFilesContext } from "@/context/FilesContext";
import dynamic from "next/dynamic";
import FolderActionBar from "./actions/FolderActionBar";
import { useSession } from "@/providers/SessionProvider";
import TagGroupedGrid from "../files/views/grid/TagGroupedGrid";

const ImagesGrid = dynamic(() => import("@/components/files/views/grid/ImagesGrid").then(mod => mod.ImagesGrid), {
	ssr: false,
});

export const FolderContent = () => {
	const { isGuest } = useSession();
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
					{isGuest ? (
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
