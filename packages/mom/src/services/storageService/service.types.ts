import { asyncIID, ServiceFactory } from "@asimojs/asimo";

/**
 * Browser Storage wrapper (cf. window.localStorage and window.sessionStorage)
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Storage
 */
export interface StorageService {
    /**
     * Returns an integer representing the number of data items stored in the Storage object
     */
    readonly length: number;
    /**
     * Get the name of the nth key in a given Storage object. The order of keys is user-agent defined, so you should not rely on it.
     * @param index an integer representing the number of the key you want to get the name of. This is a zero-based index
     */
    key(index: number): string | null;
    /**
     * When passed a key name and value, will add that key to the storage, or update that key's value if it already exists.
     * @param keyName the key associated to the item to create/update
     * @param keyValue a string containing the value you want to give the key you are creating/updating (e.g. a JSON stringified object)
     */
    setItem(keyName: string, keyValue: string): void;
    /**
     * Retrieve an item from the storage
     * @param keyName the item key
     * @returns the item or null if the key doesn't exist
     */
    getItem(keyName: string): string | null;
    /**
     * Remove an item from the storage
     * @param key the item key
     */
    removeItem(key: string): void;
    /**
     * Empty all keys out of the storage
     */
    clear(): void;
}

export const LocalStorageIID = asyncIID<StorageService>()("mom.services.LocalStorageIID");
export const SessionStorageIID = asyncIID<StorageService>()("mom.services.SessionStorageIID");

export interface FakeStorageController {
    /** Factory to create a child context providing this fake storage service */
    readonly factory: ServiceFactory<[typeof LocalStorageIID]> | ServiceFactory<[typeof SessionStorageIID]>;
    /** Reset internal state */
    reset(): void;
}
