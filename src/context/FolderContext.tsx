'use client'

import { FolderWithAccessToken, FolderWithCover, FolderWithCreatedBy, FolderWithFilesCount, FolderWithFilesWithFolderAndComments } from "@/lib/definitions";
import { AccessToken, PersonAccessToken } from "@prisma/client";
import { createContext, useContext, useState } from "react";

type FolderContextType = {
    folder: FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover & FolderWithFilesWithFolderAndComments;
    setFolder: (folder: FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover & FolderWithFilesWithFolderAndComments) => void;
    token: AccessToken | PersonAccessToken | null;
    setToken: (token: AccessToken | PersonAccessToken | null) => void;
};

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const useFolderContext = () => {
    const context = useContext(FolderContext);

    if (!context) {
        throw new Error("useFolderContext must be used within a FolderProvider");
    }

    return context;
};

export const FolderProvider = ({ children, folderData, tokenData }: { children: React.ReactNode, folderData: FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover & FolderWithFilesWithFolderAndComments, tokenData: AccessToken | PersonAccessToken | null }) => {
    const [folder, setFolder] = useState<FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover & FolderWithFilesWithFolderAndComments>(folderData);
    const [token, setToken] = useState<AccessToken | PersonAccessToken | null>(tokenData);

    return (
        <FolderContext.Provider value={{ folder, setFolder, token, setToken }}>
            {children}
        </FolderContext.Provider>
    );
};


