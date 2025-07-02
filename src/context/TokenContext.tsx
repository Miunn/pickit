'use client'

import { createContext, useContext } from "react";
import { AccessToken } from "@prisma/client";

type TokenContextType = {
    token: AccessToken | null;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);
export const useTokenContext = () => {
    const context = useContext(TokenContext);

    if (!context) {
        throw new Error("useTokenContext must be used within a TokenProvider");
    }

    return context;
}

export const TokenProvider = ({ children, token }: { children: React.ReactNode, token: AccessToken | null }) => {
    return (
        <TokenContext.Provider value={{ token }}>
            {children}
        </TokenContext.Provider>
    )
}
