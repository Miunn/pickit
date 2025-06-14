'use client'

import { generateKeys, loadKeys as loadKeysFromDB, storeKeys } from "@/lib/e2ee";
import { createContext, useContext, useState } from "react";

type E2EEncryptionContextType = {
    publicKey: CryptoKey | null;
    loadKeys: (password: string) => Promise<boolean>;
    setupKeys: (password: string, iv: Uint8Array, salt: Uint8Array) => Promise<boolean>;
}

const E2EEncryptionContext = createContext<E2EEncryptionContextType | undefined>(undefined);

export const useE2EEncryptionContext = () => {
    const context = useContext(E2EEncryptionContext);
    if (!context) {
        throw new Error("useE2EEncryptionContext must be used within a E2EEncryptionProvider");
    }
    return context;
}

export const E2EEncryptionProvider = ({ children }: { children: React.ReactNode }) => {
    const [publicKey, setPublicKey] = useState<CryptoKey | null>(null);
    const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);

    const loadKeys = async (password: string): Promise<boolean> => {
        let r = false;
        loadKeysFromDB(password, (keys: { publicKey: CryptoKey, privateKey: CryptoKey }) => {
            if (keys.publicKey && keys.privateKey) {
                console.log("Keys loaded from indexedDB", keys.publicKey, keys.privateKey);
                setPublicKey(keys.publicKey);
                setPrivateKey(keys.privateKey);
                r = true;
            }
        }, () => {
            console.log("No keys found, generating new ones");
            setupKeys(password, crypto.getRandomValues(new Uint8Array(12)), crypto.getRandomValues(new Uint8Array(16)));
        });
        return r;
    }

    const setupKeys = async (password: string, iv: Uint8Array, salt: Uint8Array): Promise<boolean> => {
        const { publicKey, privateKey } = await generateKeys();
        await storeKeys(publicKey, privateKey, iv, salt, password);
        setPublicKey(publicKey);
        setPrivateKey(privateKey);
        return true;
    }

    return (
        <E2EEncryptionContext.Provider value={{ publicKey, loadKeys, setupKeys }}>
            {children}
        </E2EEncryptionContext.Provider>
    );
}