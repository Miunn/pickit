'use client'

import { FileWithComments, FileWithLikes, FolderWithFilesCount } from "@/lib/definitions";
import { createContext, useContext, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useTokenContext } from "./TokenContext";
import { File } from "@prisma/client";

type FilesContextType = {
    files: (File & { folder: FolderWithFilesCount } & FileWithComments & FileWithLikes & { signedUrl: string })[];
    setFiles: (files: (File & { folder: FolderWithFilesCount } & FileWithComments & FileWithLikes & { signedUrl: string })[]) => void;
    hasUserLikedFile: (fileId: string) => boolean;
    canUserLikeFile: (file: FileWithLikes) => boolean;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);
export const useFilesContext = () => {
    const context = useContext(FilesContext);

    if (!context) {
        throw new Error("useFilesContext must be used within a FilesProvider");
    }

    return context;
}

export const FilesProvider = ({ children, filesData }: { children: React.ReactNode, filesData: (File & { folder: FolderWithFilesCount } & FileWithComments & FileWithLikes & { signedUrl: string })[] }) => {
    const { user } = useSession();
    const { token } = useTokenContext();
    const [files, setFiles] = useState<(File & { folder: FolderWithFilesCount } & FileWithComments & FileWithLikes & { signedUrl: string })[]>(filesData);

    const hasUserLikedFile = (fileId: string) => {
        if (!user && !token) {
            return false;
        };

        const file = files.find((file) => file.id === fileId);

        if (!file) {
            return false;
        }

        const userAuthorized = file.likes.some((like) => like.createdByEmail === user?.email);

        if (!token || !("email" in token)) {
            return userAuthorized;
        }

        const tokenAuthorized = file.likes.some((like) => like.createdByEmail === token?.email);

        return userAuthorized || tokenAuthorized;
    }

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
    }

    return (
        <FilesContext.Provider value={{ files, setFiles, hasUserLikedFile, canUserLikeFile }}>
            {children}
        </FilesContext.Provider>
    )
}
