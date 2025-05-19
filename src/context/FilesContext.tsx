'use client'

import { FileWithComments, FileWithLikes } from "@/lib/definitions";
import { FileWithFolder } from "@/lib/definitions";
import { createContext, useContext, useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useTokenContext } from "./TokenContext";
import { Role } from "@prisma/client";

type FilesContextType = {
    files: (FileWithFolder & FileWithComments & FileWithLikes)[];
    setFiles: (files: (FileWithFolder & FileWithComments & FileWithLikes)[]) => void;
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

export const FilesProvider = ({ children, filesData }: { children: React.ReactNode, filesData: (FileWithFolder & FileWithComments & FileWithLikes)[] }) => {
    const { user } = useSession();
    const { token } = useTokenContext();
    const [files, setFiles] = useState<(FileWithFolder & FileWithComments & FileWithLikes)[]>(filesData);

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
