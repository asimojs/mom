import { factory } from "@asimojs/asimo";
import { registerRootService } from "@/mom";
import { LocalStorageIID, SessionStorageIID, StorageService } from "./storageService.types";

class _Storage implements StorageService {
    constructor(private storage: Storage) {}

    get length() {
        return this.storage.length;
    }
    key(index: number): string | null {
        return this.storage.key(index);
    }
    setItem(keyName: string, keyValue: string): void {
        this.storage.setItem(keyName, keyValue);
    }
    getItem(keyName: string): string | null {
        return this.storage.getItem(keyName);
    }
    removeItem(key: string): void {
        this.storage.removeItem(key);
    }
    clear(): void {
        this.storage.clear();
    }
}

export const localStorageFactory = factory({
    provide: [LocalStorageIID],
    load: async () => new _Storage(localStorage),
});

export const sessionStorageFactory = factory({
    provide: [SessionStorageIID],
    load: async () => new _Storage(sessionStorage),
});

registerRootService(localStorageFactory);
registerRootService(sessionStorageFactory);
