'use client'

import { FileWithComments } from "@/lib/definitions";
import { FileWithFolder } from "@/lib/definitions";
import { createContext, useContext, useState } from "react";

type FilesContextType = {
    files: (FileWithFolder & FileWithComments)[];
    setFiles: (files: (FileWithFolder & FileWithComments)[]) => void;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);
export const useFilesContext = () => {
    const context = useContext(FilesContext);

    if (!context) {
        throw new Error("useFilesContext must be used within a FilesProvider");
    }

    return context;
}

export const FilesProvider = ({ children, filesData }: { children: React.ReactNode, filesData: (FileWithFolder & FileWithComments)[] }) => {
    const [files, setFiles] = useState<(FileWithFolder & FileWithComments)[]>(filesData);

    return (
        <FilesContext.Provider value={{ files, setFiles }}>
            {children}
        </FilesContext.Provider>
    )
}
