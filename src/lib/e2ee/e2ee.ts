export async function withIndexedDB(callback: (db: IDBDatabase) => void) {
	const request = indexedDB.open("echomori-e2ee", 1);
	request.onerror = event => {
		console.error("Error opening indexedDB", event);
	};
	request.onsuccess = () => {
		callback(request.result);
	};
	request.onupgradeneeded = event => {
		const db = (event.target as IDBOpenDBRequest).result;
		createStore(db);
	};
}

export function createStore(db: IDBDatabase) {
	if (!db.objectStoreNames.contains("keys")) {
		const store = db.createObjectStore("keys", { keyPath: "id", autoIncrement: true });
		store.createIndex("publicKey", "publicKey", { unique: true });
		store.createIndex("privateKey", "privateKey", { unique: true });
		store.createIndex("iv", "iv", { unique: true });
		store.createIndex("salt", "salt", { unique: true });
	}

	if (!db.objectStoreNames.contains("vaults")) {
		const store = db.createObjectStore("vaults", { keyPath: "id", autoIncrement: true });
		store.createIndex("folderId", "folderId", { unique: true });
	}
}

/**
 * Generates an ECDH key pair on the P-256 curve.
 *
 * @returns An object containing `publicKey` and `privateKey` CryptoKey objects for ECDH (P-256). Both keys are extractable and have usages `["deriveKey", "deriveBits"]`.
 */
export async function generateKeys() {
	const { publicKey, privateKey } = await crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		["deriveKey", "deriveBits"]
	);

	return { publicKey, privateKey };
}

/**
 * Derives an AES-GCM wrapping key from a password and salt using PBKDF2.
 *
 * Derives 256 bits with PBKDF2 (100000 iterations, SHA-256) and imports them as an AES-GCM key suitable for `wrapKey`/`unwrapKey`. The derived key is exported to JWK and saved in sessionStorage under the key "wrappingKey".
 *
 * @param password - The plaintext password to derive the key from.
 * @param salt - The salt used for PBKDF2 (provided as a Uint8Array of ArrayBuffer).
 * @returns An object containing `key`, the derived AES-GCM CryptoKey for wrapping/unwrapping.
 */
export async function passwordToKey(password: string, salt: Uint8Array<ArrayBuffer>) {
	// First derive a key using PBKDF2
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		{ name: "PBKDF2" },
		false,
		["deriveBits"]
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100000,
			hash: "SHA-256",
		},
		keyMaterial,
		256 // 256 bits for AES-GCM
	);

	// Then create an AES-GCM key from the derived bits
	const key = await crypto.subtle.importKey("raw", derivedBits, { name: "AES-GCM" }, true, [
		"wrapKey",
		"unwrapKey",
	]);

	// Save it to session storage
	const exportedWrappingKey = await crypto.subtle.exportKey("jwk", key);
	sessionStorage.setItem("wrappingKey", JSON.stringify(exportedWrappingKey));

	return { key };
}

/**
 * Stores an exported public key and an AES-GCM–wrapped private key in IndexedDB using a key derived from the provided password.
 *
 * @param publicKey - The ECDH public key to export and persist.
 * @param privateKey - The ECDH private key to wrap and persist.
 * @param iv - Initialization vector used for AES-GCM wrapping of the private key.
 * @param salt - Salt used to derive the wrapping key from the password (PBKDF2).
 * @param password - Password used to derive the AES-GCM wrapping key.
 * @returns An object containing the original `publicKey` and `privateKey`, the derived `wrappingKey`, and the `wrappedPrivateKey` (the private key wrapped as an ArrayBuffer).
 */
export async function storeKeys(
	publicKey: CryptoKey,
	privateKey: CryptoKey,
	iv: Uint8Array<ArrayBuffer>,
	salt: Uint8Array<ArrayBuffer>,
	password: string
): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey; wrappingKey: CryptoKey; wrappedPrivateKey: ArrayBuffer }> {
	const { key: wrappingKey } = await passwordToKey(password, salt);

	const exportedPublicKey = await crypto.subtle.exportKey("spki", publicKey);
	const wrappedPrivateKey = await crypto.subtle.wrapKey("jwk", privateKey, wrappingKey, {
		name: "AES-GCM",
		iv,
	});

	// Store keys in the device
	withIndexedDB(db => {
		const transaction = db.transaction("keys", "readwrite");

		if (!transaction.objectStoreNames.contains("keys")) {
			createStore(db);
		}

		const store = transaction.objectStore("keys");
		const result = store.put({
			id: 1, // We'll always use id 1 since we only store one set of keys
			publicKey: exportedPublicKey,
			privateKey: wrappedPrivateKey,
			iv,
			salt,
		});

		result.onsuccess = event => {
			console.log("Keys stored successfully", event);
		};

		result.onerror = event => {
			console.error("Error storing keys", event);
		};
	});

	return { publicKey, privateKey, wrappingKey, wrappedPrivateKey };
}

export async function loadKeys(
	password: string,
	callback: (keys: { publicKey: CryptoKey; privateKey: CryptoKey; wrappingKey: CryptoKey }) => void,
	onError: () => void
) {
	withIndexedDB(db => {
		const transaction = db.transaction("keys", "readonly");
		const store = transaction.objectStore("keys");
		const result = store.get(1);

		result.onsuccess = async event => {
			const keys = (event.target as IDBRequest).result;
			if (keys) {
				const { key: wrappingKey } = await passwordToKey(password, keys.salt);
				const { publicKey, privateKey } = await importKeyPair(
					keys.publicKey,
					keys.privateKey,
					wrappingKey,
					keys.iv
				);
				callback({ publicKey, privateKey, wrappingKey });
			} else {
				console.warn("No keys found");
				onError();
			}
		};

		result.onerror = event => {
			console.error("Error loading keys", event);
		};
	});
}

/**
 * Exports an ECDH key pair and wraps the private key for storage or transfer.
 *
 * @param publicKey - The public `CryptoKey` to export in SPKI format.
 * @param privateKey - The private `CryptoKey` to wrap as a JWK.
 * @param wrappingKey - The AES-GCM `CryptoKey` used to wrap the private key.
 * @param iv - Initialization vector for AES-GCM; provided as a `Uint8Array<ArrayBuffer>`.
 * @returns An object with `exportedPublicKey` (SPKI `ArrayBuffer`) and `exportedPrivateKey` (wrapped private key `ArrayBuffer`).
 */
export async function exportKeyPair(
	publicKey: CryptoKey,
	privateKey: CryptoKey,
	wrappingKey: CryptoKey,
	iv: Uint8Array<ArrayBuffer>
) {
	const exportedPublicKey = await crypto.subtle.exportKey("spki", publicKey);
	const exportedPrivateKey = await crypto.subtle.wrapKey("jwk", privateKey, wrappingKey, { name: "AES-GCM", iv });
	return { exportedPublicKey, exportedPrivateKey };
}

/**
 * Imports an ECDH public key and unwraps a wrapped private key using AES-GCM.
 *
 * @param pbKey - SPKI-encoded public key bytes to import as an ECDH public key.
 * @param prKey - Wrapped private key bytes (wrapped JWK) to unwrap.
 * @param wrappingKey - AES-GCM CryptoKey used to unwrap `prKey`.
 * @param iv - Initialization vector for AES-GCM (as a nested Uint8Array/ArrayBuffer).
 * @returns An object with `publicKey` (imported ECDH public CryptoKey) and `privateKey` (unwrapped ECDH private CryptoKey usable for deriving shared secrets).
 */
export async function importKeyPair(
	pbKey: ArrayBuffer,
	prKey: ArrayBuffer,
	wrappingKey: CryptoKey,
	iv: Uint8Array<ArrayBuffer>
) {
	const publicKey = await crypto.subtle.importKey("spki", pbKey, { name: "ECDH", namedCurve: "P-256" }, true, []);

	const privateKey = await crypto.subtle.unwrapKey(
		"jwk",
		prKey,
		wrappingKey,
		{
			name: "AES-GCM",
			iv,
		},
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		false,
		["deriveKey", "deriveBits"]
	);

	return { publicKey, privateKey };
}
