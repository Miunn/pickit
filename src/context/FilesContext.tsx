'use client'

import { FileWithComments, FileWithLikes, FolderWithFilesCount } from "@/lib/definitions";
import { createContext, useContext, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useTokenContext } from "./TokenContext";
import { File as PrismaFile } from "@prisma/client";

export type ContextFile = PrismaFile & { folder: FolderWithFilesCount } & FileWithComments & FileWithLikes & { signedUrl: string };

type FilesContextType = {
    files: ContextFile[];
    setFiles: (files: ContextFile[]) => void;
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

export const FilesProvider = ({ children, filesData }: { children: React.ReactNode, filesData: ContextFile[] }) => {
    const { user } = useSession();
    const { token } = useTokenContext();
    const [files, setFiles] = useState<ContextFile[]>(filesData);

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
