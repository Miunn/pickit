'use client'

import { FolderWithAccessToken, FolderWithCover, FolderWithCreatedBy, FolderWithFilesCount } from "@/lib/definitions";
import { AccessToken, PersonAccessToken } from "@prisma/client";
import { createContext, useContext, useState } from "react";

type FolderContextType = {
    folder: FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover;
    setFolder: (folder: FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover) => void;
    token: AccessToken | PersonAccessToken | null;
    setToken: (token: AccessToken | PersonAccessToken | null) => void;
    tokenType: "accessToken" | "personAccessToken" | null;
    tokenHash: string | null;
};

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const useFolderContext = () => {
    const context = useContext(FolderContext);

    if (!context) {
        throw new Error("useFolderContext must be used within a FolderProvider");
    }

    return context;
};

export const FolderProvider = ({ children, folderData, tokenData, tokenType, tokenHash }: { children: React.ReactNode, folderData: FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover, tokenData: AccessToken | PersonAccessToken | null, tokenType: "accessToken" | "personAccessToken" | null, tokenHash: string | null }) => {
    const [folder, setFolder] = useState<FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover>(folderData);
    const [token, setToken] = useState<AccessToken | PersonAccessToken | null>(tokenData);

    return (
        <FolderContext.Provider value={{ folder, setFolder, token, setToken, tokenType, tokenHash }}>
            {children}
        </FolderContext.Provider>
    );
};


