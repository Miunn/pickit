"use client";

import { setupE2EE } from "@/actions/user";
import { exportKeyPair, generateKeys, loadKeys as loadKeysFromDB, storeKeys } from "@/lib/e2ee/e2ee";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type E2EEncryptionContextType = {
	publicKey: CryptoKey | null;
	wrappingKey: CryptoKey | null;
	loadKeys: (password: string) => Promise<boolean>;
	setupKeys: (password: string, iv: Uint8Array<ArrayBuffer>, salt: Uint8Array<ArrayBuffer>) => Promise<boolean>;
	loadWrappingKeyFromSessionStorage: () => void;
};

const E2EEncryptionContext = createContext<E2EEncryptionContextType | undefined>(undefined);

export const useE2EEncryptionContext = () => {
	const context = useContext(E2EEncryptionContext);
	if (!context) {
		throw new Error("useE2EEncryptionContext must be used within a E2EEncryptionProvider");
	}
	return context;
};

/**
 * Provides the E2E encryption context and manages encryption key lifecycle for descendant components.
 *
 * The provider maintains the public and wrapping keys in state, attempts to load a wrapping key from
 * session storage on mount, and exposes utilities to load keys from storage, initialize new keys,
 * and reload the wrapping key into memory.
 *
 * @param children - Child elements that will receive the E2E encryption context
 * @returns A React context provider that supplies `publicKey`, `wrappingKey`, `loadKeys`, `setupKeys`, and `loadWrappingKeyFromSessionStorage` to its descendants
 */
export function E2EEncryptionProvider({ children }: { readonly children: React.ReactNode }) {
	const [publicKey, setPublicKey] = useState<CryptoKey | null>(null);
	const [wrappingKey, setWrappingKey] = useState<CryptoKey | null>(null);

	const setupKeys = useCallback(
		async (
			password: string,
			iv: Uint8Array<ArrayBuffer>,
			salt: Uint8Array<ArrayBuffer>
		): Promise<boolean> => {
			const { publicKey, privateKey } = await generateKeys();
			const { wrappingKey } = await storeKeys(publicKey, privateKey, iv, salt, password);
			setPublicKey(publicKey);
			setWrappingKey(wrappingKey); // This key lives only in memory

			const { exportedPublicKey, exportedPrivateKey } = await exportKeyPair(
				publicKey,
				privateKey,
				wrappingKey,
				iv
			);
			await setupE2EE(
				Buffer.from(exportedPrivateKey).toString("base64"),
				Buffer.from(exportedPublicKey).toString("base64"),
				Buffer.from(iv).toString("base64"),
				Buffer.from(salt).toString("base64")
			);
			return true;
		},
		[]
	);

	const loadKeys = useCallback(
		async (password: string): Promise<boolean> => {
			let r = false;
			loadKeysFromDB(
				password,
				(keys: { publicKey: CryptoKey; privateKey: CryptoKey; wrappingKey: CryptoKey }) => {
					if (keys.publicKey && keys.privateKey) {
						setPublicKey(keys.publicKey);
						setWrappingKey(keys.wrappingKey);
						r = true;

						console.log("Public key", keys.publicKey);
						console.log("Private key", keys.privateKey);
						console.log("Wrapping key", keys.wrappingKey);
					}
				},
				() => {
					console.log("No keys found, generating new ones");
					setupKeys(
						password,
						crypto.getRandomValues(new Uint8Array(12)),
						crypto.getRandomValues(new Uint8Array(16))
					);
				}
			);
			return r;
		},
		[setupKeys]
	);

	const loadWrappingKeyFromSessionStorage = useCallback(() => {
		console.log("Loading wrapping key from session storage");
		const wrappingKey = sessionStorage.getItem("wrappingKey");
		if (wrappingKey) {
			crypto.subtle
				.importKey("jwk", JSON.parse(wrappingKey), { name: "AES-GCM" }, false, [
					"wrapKey",
					"unwrapKey",
				])
				.then(key => {
					setWrappingKey(key);
				});
			console.log("Wrapping key loaded from session storage", wrappingKey);
		}
	}, []);

	useEffect(() => {
		if (!wrappingKey) {
			loadWrappingKeyFromSessionStorage();
		}
	}, [wrappingKey, loadWrappingKeyFromSessionStorage]);

	const providerValue = useMemo(
		() => ({ publicKey, wrappingKey, loadKeys, setupKeys, loadWrappingKeyFromSessionStorage }),
		[publicKey, wrappingKey, loadKeys, setupKeys, loadWrappingKeyFromSessionStorage]
	);

	return <E2EEncryptionContext.Provider value={providerValue}>{children}</E2EEncryptionContext.Provider>;
}
