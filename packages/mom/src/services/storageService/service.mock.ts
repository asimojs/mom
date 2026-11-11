import { factory } from "@asimojs/asimo";
import { FakeStorageController, LocalStorageIID, SessionStorageIID, StorageService } from "./service.types";

class FakeStorageService implements StorageService, FakeStorageController {
    readonly factory: FakeStorageController["factory"];

    private storage: Map<string, string> = new Map();
    private keys: string[] | null = null;

    constructor(type: "local" | "session") {
        if (type === "local") {
            this.factory = factory({
                provide: [LocalStorageIID],
                load: async () => this,
            });
        } else {
            this.factory = factory({
                provide: [SessionStorageIID],
                load: async () => this,
            });
        }
    }

    get length() {
        return this.storage.size;
    }
    key(index: number): string | null {
        if (this.keys === null) {
            // cache keys to avoid re-processing them in case of loop
            this.keys = [...this.storage.keys()];
        }
        return this.keys[index] ?? null;
    }
    setItem(keyName: string, keyValue: string): void {
        this.keys = null;
        this.storage.set(keyName, keyValue);
    }
    getItem(keyName: string): string | null {
        return this.storage.get(keyName) ?? null;
    }
    removeItem(key: string): void {
        this.keys = null;
        this.storage.delete(key);
    }
    clear(): void {
        this.keys = null;
        this.storage.clear();
    }
    reset() {
        this.keys = null;
        this.storage.clear();
    }
}

/**
 * Create a fake StorageService instance
 * @param type "local" or "session" storage
 */
export function createFakeStorageService(type: "local" | "session"): FakeStorageController {
    const service = new FakeStorageService(type);
    return service;
}
