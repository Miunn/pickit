"use client";

import { FileWithComments, FileWithLikes, FolderWithFilesCount, FileWithTags, FolderWithTags } from "@/lib/definitions";
import { createContext, useContext, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useTokenContext } from "./TokenContext";
import { File as PrismaFile } from "@prisma/client";
import { ImagesSortMethod } from "@/types/imagesSort";
import { getSortedImagesVideosContent } from "@/lib/utils";
import { ViewState } from "@/components/folders/ViewSelector";
import { useQueryState } from "nuqs";

export type ContextFile = PrismaFile &
    FileWithTags & {
        folder: FolderWithFilesCount & FolderWithTags;
    } & FileWithComments &
    FileWithLikes;

type FilesContextType = {
    files: ContextFile[];
    setFiles: React.Dispatch<React.SetStateAction<ContextFile[]>>;
    hasUserLikedFile: (fileId: string) => boolean;
    canUserLikeFile: (file: FileWithLikes) => boolean;
    getSortedFiles: (sortStrategy: ImagesSortMethod | "dragOrder", sortState: ImagesSortMethod) => ContextFile[];
    viewState: ViewState;
    setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
    sortState: ImagesSortMethod;
    setSortState: React.Dispatch<React.SetStateAction<ImagesSortMethod>>;
};

const FilesContext = createContext<FilesContextType | undefined>(undefined);
export const useFilesContext = () => {
    const context = useContext(FilesContext);

    if (!context) {
        throw new Error("useFilesContext must be used within a FilesProvider");
    }

    return context;
};

export const FilesProvider = ({
    children,
    filesData,
    defaultView,
}: {
    children: React.ReactNode;
    filesData: ContextFile[];
    defaultView: ViewState;
}) => {
    const { user } = useSession();
    const { token } = useTokenContext();
    const [files, setFiles] = useState<ContextFile[]>(filesData);
    const [viewState, setViewState] = useQueryState<ViewState>("view", {
        defaultValue: defaultView || ViewState.Grid,
        parse: v => {
            switch (v) {
                case "grid":
                    return ViewState.Grid;
                case "list":
                    return ViewState.List;
                case "tagGrouped":
                    return ViewState.TagGrouped;
                default:
                    return ViewState.Grid;
            }
        },
    });
    const [sortState, setSortState] = useQueryState<ImagesSortMethod>("sort", {
        defaultValue: ImagesSortMethod.DateDesc,
        parse: v => {
            switch (v) {
                case "name-asc":
                    return ImagesSortMethod.NameAsc;
                case "name-desc":
                    return ImagesSortMethod.NameDesc;
                case "size-asc":
                    return ImagesSortMethod.SizeAsc;
                case "size-desc":
                    return ImagesSortMethod.SizeDesc;
                case "date-asc":
                    return ImagesSortMethod.DateAsc;
                case "date-desc":
                    return ImagesSortMethod.DateDesc;
                case "taken-asc":
                    return ImagesSortMethod.TakenAsc;
                case "taken-desc":
                    return ImagesSortMethod.TakenDesc;
                case "position-asc":
                    return ImagesSortMethod.PositionAsc;
                case "position-desc":
                    return ImagesSortMethod.PositionDesc;
                default:
                    return ImagesSortMethod.DateDesc;
            }
        },
    });

    const hasUserLikedFile = (fileId: string) => {
        if (!user && !token) {
            return false;
        }

        const file = files.find(file => file.id === fileId);

        if (!file) {
            return false;
        }

        const userAuthorized = file.likes.some(like => like.createdByEmail === user?.email);

        if (!token || !("email" in token)) {
            return userAuthorized;
        }

        const tokenAuthorized = file.likes.some(like => like.createdByEmail === token?.email);

        return userAuthorized || tokenAuthorized;
    };

    const canUserLikeFile = (file: FileWithLikes) => {
        if (user?.id === file.createdById) {
            return true;
        }

        if (!user && !token) {
            return false;
        }

        if (!token || !("email" in token)) {
            return false;
        }

        return true;
    };

    const getSortedFiles = (
        sortStrategy: ImagesSortMethod | "dragOrder",
        sortState: ImagesSortMethod
    ): ContextFile[] => {
        if (sortStrategy !== "dragOrder") {
            const sortedItems = [...getSortedImagesVideosContent(files, sortState)] as ContextFile[];
            return sortedItems;
        }

        const orderedItems = [...files];
        const sortedItems = [...orderedItems].sort((a, b) => {
            const aIndex = files.findIndex(file => file.id === a.id);
            const bIndex = files.findIndex(file => file.id === b.id);
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
        return sortedItems;
    };

    return (
        <FilesContext.Provider
            value={{
                files,
                setFiles,
                hasUserLikedFile,
                canUserLikeFile,
                getSortedFiles,
                viewState,
                setViewState,
                sortState,
                setSortState,
            }}
        >
            {children}
        </FilesContext.Provider>
    );
};
