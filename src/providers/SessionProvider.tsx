'use client'

import { Session } from "@prisma/client";
import { UserWithCounts } from "@/lib/definitions";
import { createContext, useContext } from "react";

interface SessionProviderType {
    user: UserWithCounts | null;
    session: Session | null;
    isGuest: boolean;
}

const SessionContext = createContext<SessionProviderType>({} as SessionProviderType);

export default function SessionProvider({ children, user, session }: { readonly children: React.ReactNode, readonly user: UserWithCounts | null, readonly session: Session | null }) {
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

