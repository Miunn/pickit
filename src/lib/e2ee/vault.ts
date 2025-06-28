export async function withIndexedDB(callback: (db: IDBDatabase) => void) {
    const request = indexedDB.open("echomori-e2ee", 1);
    request.onerror = () => {
        console.error("Error opening indexedDB");
    };
    request.onsuccess = () => {
        callback(request.result);
    };
    request.onupgradeneeded = (event) => {
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
        store.createIndex("wrappedKey", "wrappedKey", { unique: true });
        store.createIndex("iv", "iv", { unique: true });
    }
}

export const createVault = async (folderId: string, wrappingKey: CryptoKey): Promise<{ key: CryptoKey, encryptedKey: ArrayBuffer, iv: Uint8Array }> => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const wrappedKey = await crypto.subtle.wrapKey("jwk", key, wrappingKey, { name: "AES-GCM", iv });

    withIndexedDB(async (db) => {
        const transaction = db.transaction("vaults", "readwrite");
        const store = transaction.objectStore("vaults");
        const request = store.add({ folderId, wrappedKey, iv });
        request.onsuccess = () => {
            console.log("Vault created", request.result);
        };
    });

    return { key, encryptedKey: wrappedKey, iv };
}

export const loadVault = async (wrappedKey: ArrayBuffer, iv: Uint8Array, wrappingKey: CryptoKey): Promise<CryptoKey> => {
    console.log("Loading vault", wrappedKey, iv, wrappingKey);
    return crypto.subtle.unwrapKey(
        "jwk",
        wrappedKey,
        wrappingKey,
        { name: "AES-GCM", iv: iv },  // Describing wrapping key
        { name: "AES-GCM", length: 256 },   // Describing wrapped key
        true,
        ["encrypt", "decrypt"]
    );
}