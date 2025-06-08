'use client'

import { useTranslations } from "next-intl";
import { ImagesSortMethod } from "./SortImages";
import { useQueryState } from 'nuqs'
import { ViewState } from "./ViewSelector";
import ImagesList from "../files/views/list/ImagesList";
import { useState } from "react";
import { useFolderContext } from "@/context/FolderContext";
import { useFilesContext } from "@/context/FilesContext";
import dynamic from "next/dynamic";
import FolderActionBar from "./FolderActionBar";
import { useSession } from "@/providers/SessionProvider";
import TagGroupedGrid from "../files/views/grid/TagGroupedGrid";

const ImagesGrid = dynamic(() => import('@/components/files/views/grid/ImagesGrid').then(mod => mod.ImagesGrid), {
    ssr: false,
});

export interface FolderContentProps {
    defaultView?: ViewState;
    isGuest?: boolean;
}

export const FolderContent = () => {
    const { isGuest } = useSession();
    const { folder } = useFolderContext();
    const { viewState, sortState } = useFilesContext();

    const t = useTranslations("folders");

    const renderContent = () => {
        switch (viewState) {
            case ViewState.List:
                return <ImagesList />;
            case ViewState.TagGrouped:
                return <TagGroupedGrid />;
            default:
                return <ImagesGrid sortState={sortState} />;
        }
    }

    return (
        <div>
            <h3 className={"mb-2 flex justify-between items-center"}>
                <p className="font-semibold">{folder.name} {
                    isGuest
                        ? <span className="font-normal text-sm">- {t('sharedBy', { name: folder.createdBy.name })}</span>
                        : null
                }</p>

                <FolderActionBar />
            </h3>

            <div className="flex-1 overflow-auto">
                {renderContent()}
            </div>
        </div>
    )
}