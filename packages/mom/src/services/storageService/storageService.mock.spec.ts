import { asm, createContainer, IoCContainer } from "@asimojs/asimo";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createFakeStorageService } from "./storageService.mock";
import { FakeStorageController, LocalStorageIID, SessionStorageIID, StorageService } from "./storageService.types";

describe("Fake Storage Service", () => {
    let context: IoCContainer,
        localStorageController: FakeStorageController,
        sessionStorageController: FakeStorageController,
        localStorage: StorageService,
        sessionStorage: StorageService;

    const keyA = "keyA",
        keyB = "keyB";

    beforeEach(async () => {
        context = createContainer({ parent: asm, name: "test:fakeStorageService" });
        localStorageController = createFakeStorageService(context, "local");
        sessionStorageController = createFakeStorageService(context, "session");
        [localStorage, sessionStorage] = await context.fetch(LocalStorageIID, SessionStorageIID);
    });

    describe("Local Storage", () => {
        it("should not be session storage", async () => {
            expect(localStorage).not.toBe(sessionStorage);
        });

        it("should save / retrieve items", async () => {
            testStorageService(localStorage, localStorageController);
        });
    });

    describe("Session storage", () => {
        it("should save / retrieve items", async () => {
            testStorageService(sessionStorage, sessionStorageController);
        });
    });

    function testStorageService(storage: StorageService, controller: FakeStorageController) {
        expect(storage.length).toBe(0);
        expect(storage.getItem(keyA)).toBe(null);
        expect(storage.getItem(keyB)).toBe(null);
        expect(storage.key(0)).toBe(null);
        expect(storage.key(1)).toBe(null);

        storage.setItem(keyA, "valueA");
        expect(storage.length).toBe(1);
        expect(storage.getItem(keyA)).toBe("valueA");
        expect(storage.getItem(keyB)).toBe(null);
        expect(storage.key(0)).toBe("keyA");
        expect(storage.key(1)).toBe(null);

        storage.setItem(keyB, "valueB");
        expect(storage.length).toBe(2);
        expect(storage.getItem(keyA)).toBe("valueA");
        expect(storage.getItem(keyB)).toBe("valueB");
        expect(storage.key(0)).toBe("keyA");
        expect(storage.key(1)).toBe("keyB");

        storage.removeItem("foobar"); // no changes
        expect(storage.length).toBe(2);
        expect(storage.getItem(keyA)).toBe("valueA");
        expect(storage.getItem(keyB)).toBe("valueB");
        expect(storage.key(0)).toBe("keyA");
        expect(storage.key(1)).toBe("keyB");

        storage.removeItem("keyA");
        expect(storage.length).toBe(1);
        expect(storage.getItem(keyA)).toBe(null);
        expect(storage.getItem(keyB)).toBe("valueB");
        expect(storage.key(0)).toBe("keyB");
        expect(storage.key(1)).toBe(null);

        storage.setItem(keyA, "valueA2");
        expect(storage.length).toBe(2);
        expect(storage.getItem(keyA)).toBe("valueA2");
        expect(storage.getItem(keyB)).toBe("valueB");
        expect(storage.key(0)).toBe("keyB");
        expect(storage.key(1)).toBe("keyA");

        storage.clear();
        expect(storage.length).toBe(0);
        expect(storage.getItem(keyA)).toBe(null);
        expect(storage.getItem(keyB)).toBe(null);
        expect(storage.key(0)).toBe(null);

        storage.setItem(keyA, "valueA");
        expect(storage.length).toBe(1);
        expect(storage.getItem(keyA)).toBe("valueA");
        expect(storage.getItem(keyB)).toBe(null);
        expect(storage.key(0)).toBe("keyA");
        expect(storage.key(1)).toBe(null);

        controller.reset();
        expect(storage.length).toBe(0);
        expect(storage.getItem(keyA)).toBe(null);
        expect(storage.getItem(keyB)).toBe(null);
        expect(storage.key(0)).toBe(null);
    }
});
