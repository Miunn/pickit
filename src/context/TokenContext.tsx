'use client'

import { createContext, useContext, useState } from "react";
import { AccessToken, PersonAccessToken } from "@prisma/client";

type TokenContextType = {
    token: AccessToken | PersonAccessToken | null;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);
export const useTokenContext = () => {
    const context = useContext(TokenContext);

    if (!context) {
        throw new Error("useTokenContext must be used within a TokenProvider");
    }

    return context;
}

export const TokenProvider = ({ children, token }: { children: React.ReactNode, token: AccessToken | PersonAccessToken | null }) => {
    return (
        <TokenContext.Provider value={{ token }}>
            {children}
        </TokenContext.Provider>
    )
}
