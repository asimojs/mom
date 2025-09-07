import { IoCContainer } from "@asimojs/asimo";
import { FakeStorageController, LocalStorageIID, SessionStorageIID, StorageService } from "./storageService.types";

class FakeStorageService implements StorageService, FakeStorageController {
    private storage: Map<string, string> = new Map();
    private keys: string[] | null = null;

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

export function createFakeStorageService(context: IoCContainer, type: "local" | "session"): FakeStorageController {
    const service = new FakeStorageService();
    if (type === "local") {
        context.registerService(LocalStorageIID, () => service);
    } else if (type === "session") {
        context.registerService(SessionStorageIID, () => service);
    }
    return service;
}
