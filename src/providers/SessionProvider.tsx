'use client'

import { Session, User } from "@prisma/client";
import { createContext, useContext } from "react";

interface SessionProviderProps {
    user: User | null;
    session: Session | null;
}

const SessionContext = createContext<SessionProviderProps>({} as SessionProviderProps);

export default function SessionProvider({ children, values }: { children: React.ReactNode, values: SessionProviderProps }) {
    return <SessionContext.Provider value={values}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }

    return context;
}

