'use client'

import { setupE2EE } from "@/actions/user";
import { exportKeyPair, generateKeys, loadKeys as loadKeysFromDB, passwordToKey, storeKeys, withIndexedDB } from "@/lib/e2ee/e2ee";
import { createContext, useContext, useEffect, useState } from "react";

type E2EEncryptionContextType = {
    publicKey: CryptoKey | null;
    wrappingKey: CryptoKey | null;
    loadKeys: (password: string) => Promise<boolean>;
    setupKeys: (password: string, iv: Uint8Array, salt: Uint8Array) => Promise<boolean>;
    loadWrappingKeyFromSessionStorage: () => void;
}

const E2EEncryptionContext = createContext<E2EEncryptionContextType | undefined>(undefined);

export const useE2EEncryptionContext = () => {
    const context = useContext(E2EEncryptionContext);
    if (!context) {
        throw new Error("useE2EEncryptionContext must be used within a E2EEncryptionProvider");
    }
    return context;
}

export function E2EEncryptionProvider({ children }: { children: React.ReactNode }) {
    const [publicKey, setPublicKey] = useState<CryptoKey | null>(null);
    const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
    const [wrappingKey, setWrappingKey] = useState<CryptoKey | null>(null);

    useEffect(() => {
        if (!wrappingKey) {
            loadWrappingKeyFromSessionStorage();
        }
    }, [wrappingKey]);

    const loadKeys = async (password: string): Promise<boolean> => {
        let r = false;
        loadKeysFromDB(password, (keys: { publicKey: CryptoKey, privateKey: CryptoKey, wrappingKey: CryptoKey }) => {
            if (keys.publicKey && keys.privateKey) {
                setPublicKey(keys.publicKey);
                setPrivateKey(keys.privateKey);
                setWrappingKey(keys.wrappingKey);
                r = true;

                console.log("Public key", keys.publicKey);
                console.log("Private key", keys.privateKey);
                console.log("Wrapping key", keys.wrappingKey);
            }
        }, () => {
            console.log("No keys found, generating new ones");
            setupKeys(password, crypto.getRandomValues(new Uint8Array(12)), crypto.getRandomValues(new Uint8Array(16)));
        });
        return r;
    }

    const setupKeys = async (password: string, iv: Uint8Array, salt: Uint8Array): Promise<boolean> => {
        const { publicKey, privateKey } = await generateKeys();
        const { wrappingKey } = await storeKeys(publicKey, privateKey, iv, salt, password);
        setPublicKey(publicKey);
        setPrivateKey(privateKey);
        setWrappingKey(wrappingKey);     // This key lives only in memory

        const { exportedPublicKey, exportedPrivateKey } = await exportKeyPair(publicKey, privateKey, wrappingKey, iv);
        await setupE2EE(Buffer.from(exportedPrivateKey).toString("base64"), Buffer.from(exportedPublicKey).toString("base64"), Buffer.from(iv).toString("base64"), Buffer.from(salt).toString("base64"));
        return true;
    }

    const loadWrappingKeyFromSessionStorage = () => {
        console.log("Loading wrapping key from session storage");
            const wrappingKey = sessionStorage.getItem("wrappingKey");
            if (wrappingKey) {   
                crypto.subtle.importKey("jwk", JSON.parse(wrappingKey), { name: "AES-GCM" }, false, ["wrapKey", "unwrapKey"]).then((key) => {
                    setWrappingKey(key);
                });
                console.log("Wrapping key loaded from session storage", wrappingKey);
            }
    }

    return (
        <E2EEncryptionContext.Provider value={{ publicKey, wrappingKey, loadKeys, setupKeys, loadWrappingKeyFromSessionStorage }}>
            {children}
        </E2EEncryptionContext.Provider>
    );
}