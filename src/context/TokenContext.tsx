"use client";

import { createContext, useContext, useMemo } from "react";
import { AccessToken } from "@prisma/client";

type TokenContextType = {
	token: AccessToken | null;
};

const TokenContext = createContext<TokenContextType | undefined>(undefined);
export const useTokenContext = () => {
	const context = useContext(TokenContext);

	if (!context) {
		throw new Error("useTokenContext must be used within a TokenProvider");
	}

	return context;
};

export const TokenProvider = ({
	children,
	token,
}: {
	readonly children: React.ReactNode;
	readonly token: AccessToken | null;
}) => {
	const providerValue = useMemo(() => ({ token }), [token]);

	return <TokenContext.Provider value={providerValue}>{children}</TokenContext.Provider>;
};
