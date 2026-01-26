"use client";

import {
	FolderWithAccessToken,
	FolderWithCover,
	FolderWithCreatedBy,
	FolderWithFilesCount,
	FolderWithLastSlug,
	FolderWithTags,
} from "@/lib/definitions";
import { createVault, loadVault } from "@/lib/e2ee/vault";
import { AccessToken } from "@prisma/client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useE2EEncryptionContext } from "@/context/E2EEncryptionContext";
import { updateFolderKey } from "@/actions/folders";

type FolderContextType = {
	folder: FolderWithLastSlug &
		FolderWithTags &
		FolderWithCreatedBy &
		FolderWithAccessToken &
		FolderWithFilesCount &
		FolderWithCover;
	setFolder: React.Dispatch<
		React.SetStateAction<
			FolderWithLastSlug &
				FolderWithTags &
				FolderWithCreatedBy &
				FolderWithAccessToken &
				FolderWithFilesCount &
				FolderWithCover
		>
	>;
	token: AccessToken | null;
	setToken: (token: AccessToken | null) => void;
	tokenHash: string | null;
	isShared: boolean;
};

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const useFolderContext = () => {
	const context = useContext(FolderContext);

	if (!context) {
		throw new Error("useFolderContext must be used within a FolderProvider");
	}

	return context;
};

export function FolderProvider({
	children,
	folderData,
	tokenData,
	tokenHash,
	isShared,
}: {
	readonly children: React.ReactNode;
	readonly folderData: FolderWithLastSlug &
		FolderWithTags &
		FolderWithCreatedBy &
		FolderWithAccessToken &
		FolderWithFilesCount &
		FolderWithCover;
	readonly tokenData: AccessToken | null;
	readonly tokenHash: string | null;
	readonly isShared: boolean;
}) {
	const [folder, setFolder] = useState<
		FolderWithLastSlug &
			FolderWithTags &
			FolderWithCreatedBy &
			FolderWithAccessToken &
			FolderWithFilesCount &
			FolderWithCover
	>(folderData);
	const [token, setToken] = useState<AccessToken | null>(tokenData);

	const { wrappingKey } = useE2EEncryptionContext();

	useEffect(() => {
		if (!wrappingKey) {
			console.warn("Wrapping key not found, skipping folder key loading");
			return;
		}

		if (folder.key) {
			loadVault(
				Buffer.from(folder.key, "base64").buffer,
				new Uint8Array(Buffer.from(folder.iv, "base64")),
				wrappingKey
			).then(key => {
				console.log("Loaded folder key from server", key);
			});
		} else {
			createVault(folder.id, wrappingKey).then(({ key, encryptedKey, iv }) => {
				setFolder({
					...folder,
					key: Buffer.from(encryptedKey).toString("base64"),
					iv: Buffer.from(iv).toString("base64"),
				});
				updateFolderKey(
					folder.id,
					Buffer.from(encryptedKey).toString("base64"),
					Buffer.from(iv).toString("base64")
				).then(({ error }) => {
					if (error) {
						console.error("Error updating folder key", error);
					}
				});

				console.log("Created folder key", key);
				console.log("Created iv", iv);
			});
		}
	}, [folder, wrappingKey]);

	const providerValue = useMemo(
		() => ({
			folder,
			setFolder,
			token,
			setToken,
			tokenHash,
			isShared,
		}),
		[folder, setFolder, token, setToken, tokenHash, isShared]
	);

	return <FolderContext.Provider value={providerValue}>{children}</FolderContext.Provider>;
}
