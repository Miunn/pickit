'use client'

import { Session, User } from "@prisma/client";
import { createContext, useContext } from "react";

interface SessionProviderProps {
    user: User | null;
    session: Session | null;
    isGuest: boolean;
}

const SessionContext = createContext<SessionProviderProps>({} as SessionProviderProps);

export default function SessionProvider({ children, values }: { children: React.ReactNode, values: SessionProviderProps }) {
    const isGuest = !values.session;

    return <SessionContext.Provider value={{ ...values, isGuest }}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }

    return context;
}

