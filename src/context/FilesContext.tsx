"use client";

import { FileWithComments, FileWithLikes, FolderWithFilesCount, FileWithTags, FolderWithTags } from "@/lib/definitions";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useTokenContext } from "./TokenContext";
import { File as PrismaFile } from "@prisma/client";
import { getSortedContent } from "@/lib/utils";
import { ViewState } from "@/components/folders/ViewSelector";
import { useQueryState } from "nuqs";
import { FilesSort, FilesSortDefinition } from "@/types/imagesSort";

export type ContextFile = PrismaFile &
	FileWithTags & {
		folder: FolderWithFilesCount & FolderWithTags;
	} & FileWithComments &
	FileWithLikes;

type FilesContextType = {
	files: ContextFile[];
	setFiles: React.Dispatch<React.SetStateAction<ContextFile[]>>;
	sortedFiles: ContextFile[];
	hasUserLikedFile: (fileId: string) => boolean;
	canUserLikeFile: (file: FileWithLikes) => boolean;
	getSortedFiles: (
		sortStrategy: FilesSortDefinition | "dragOrder",
		sortState: FilesSortDefinition
	) => ContextFile[];
	viewState: ViewState;
	setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
	sortState: FilesSortDefinition;
	setSortState: React.Dispatch<React.SetStateAction<FilesSortDefinition>>;
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
	readonly children: React.ReactNode;
	readonly filesData: ContextFile[];
	readonly defaultView: ViewState;
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
	const [sortState, setSortState] = useQueryState<FilesSortDefinition>("sort", {
		defaultValue: FilesSort.Position,
		parse: v => {
			switch (v) {
				case "name-asc":
					return FilesSort.Name.Asc;
				case "name-desc":
					return FilesSort.Name.Desc;
				case "size-asc":
					return FilesSort.Size.Asc;
				case "size-desc":
					return FilesSort.Size.Desc;
				case "date-asc":
					return FilesSort.Date.Asc;
				case "date-desc":
					return FilesSort.Date.Desc;
				case "taken-asc":
					return FilesSort.Taken.Asc;
				case "taken-desc":
					return FilesSort.Taken.Desc;
				case "position":
					return FilesSort.Position;
				default:
					return FilesSort.Position;
			}
		},
	});

	const sortedFiles = useMemo(() => {
		return getSortedContent([...files], sortState) as ContextFile[];
	}, [files, sortState]);

	const hasUserLikedFile = useCallback(
		(fileId: string) => {
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
		},
		[user, token, files]
	);

	const canUserLikeFile = useCallback(
		(file: FileWithLikes) => {
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
		},
		[user, token]
	);

	const getSortedFiles = useCallback(
		(sortStrategy: FilesSortDefinition | "dragOrder"): ContextFile[] => {
			if (sortStrategy !== "dragOrder") {
				const sortedItems = getSortedContent([...files], sortStrategy) as ContextFile[];
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
		},
		[files]
	);

	const providerValue = useMemo(
		() => ({
			files,
			setFiles,
			sortedFiles,
			hasUserLikedFile,
			canUserLikeFile,
			getSortedFiles,
			viewState,
			setViewState,
			sortState,
			setSortState,
		}),
		[
			files,
			setFiles,
			sortedFiles,
			hasUserLikedFile,
			canUserLikeFile,
			getSortedFiles,
			viewState,
			setViewState,
			sortState,
			setSortState,
		]
	);

	return <FilesContext.Provider value={providerValue}>{children}</FilesContext.Provider>;
};
