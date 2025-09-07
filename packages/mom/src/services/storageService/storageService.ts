import { asm } from "@asimojs/asimo";
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

asm.registerService(LocalStorageIID, () => new _Storage(localStorage));
asm.registerService(SessionStorageIID, () => new _Storage(sessionStorage));
