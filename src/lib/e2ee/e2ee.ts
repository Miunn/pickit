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
    const key = await crypto.subtle.importKey("raw", derivedBits, { name: "AES-GCM" }, true, ["wrapKey", "unwrapKey"]);

    // Save it to session storage
    const exportedWrappingKey = await crypto.subtle.exportKey("jwk", key);
    sessionStorage.setItem("wrappingKey", JSON.stringify(exportedWrappingKey));

    return { key };
}

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
 * Import a private key from a wrapped key
 * @param prKey - ArrayBuffer of the wrapped private key
 * @param wrappingKey - Wrapping CryptoKey
 * @param iv - Initialization AES vector
 * @returns The private CryptoKey
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

// export async function importKey(key: string) {
//     return crypto.subtle.importKey(
//         "spki",
//         Buffer.from(key, "base64"),
//         { name: "ECDH", namedCurve: "P-256" },
//         true,
//         ["deriveKey", "deriveBits"],
//     );
// }

// export async function getKeys(publicKeyString: string) {
//     const publicKey = await crypto.subtle.importKey(
//         "spki",
//         Buffer.from(publicKeyString, "base64"),
//         { name: "ECDH", namedCurve: "P-256" },
//         true,
//         ["deriveKey", "deriveBits"],
//     );

//     return { publicKey };
// }
