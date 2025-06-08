'use client'

import { Session, User } from "@prisma/client";
import { createContext, useContext } from "react";

interface SessionProviderType {
    user: User | null;
    session: Session | null;
    isGuest: boolean;
}

const SessionContext = createContext<SessionProviderType>({} as SessionProviderType);

export default function SessionProvider({ children, user, session }: { children: React.ReactNode, user: User | null, session: Session | null }) {
    const isGuest = !session;

    return <SessionContext.Provider value={{ user, session, isGuest }}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }

    return context;
}

