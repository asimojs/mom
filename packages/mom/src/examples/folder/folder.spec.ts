import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { asm, AsmContext } from "@asimojs/asimo";
import { disposeStore, createStore } from "@/mom";
import { FolderStore } from "./folder";
import { Folder, FolderData } from "./folder.types";

describe("Folder", () => {
    let context: AsmContext,
        store: Folder | null = null;

    beforeEach(() => {
        context = asm.createChildContext("test:Folder");
    });

    afterEach(() => {
        store && disposeStore(store);
    });

    const Data1: FolderData = {
        name: "root",
        files: ["file1", "file2"],
        folders: [
            {
                name: "folderA",
                folders: [{ name: "folderA.A" }, { name: "folderA.B", files: ["file3"] }],
            },
            {
                name: "folderB",
                folders: [{ name: "folderB.A", files: ["file4"] }],
            },
        ],
    };

    describe("Load", () => {
        it("should support empty root stores", async () => {
            store = createStore({ $store: FolderStore, data: {}, parent: null });
            expect(store["#ready"]).toBe(true);
            expect(store.isExpanded).toBe(false);
            expect(store.name).toBe("[Unnamed folder]");
            expect(store.path).toBe("/");
            expect(store.files.length).toBe(0);
            expect(store.folders.length).toBe(0);
        });

        it("should load sub-store on-demand (init:collapsed)", async () => {
            store = createStore({ $store: FolderStore, data: Data1, parent: null, expanded: false });
            expect(store.isExpanded).toBe(false);
            expect(store.name).toBe("root");
            expect(store.path).toBe("/");
            expect(store.files.join(", ")).toBe("file1, file2");
            expect(store.folders.length).toBe(0); // not loaded

            store.expand(true);
            expect(store.folders.length).toBe(2);
            const f0 = store.folders[0];
            expect(f0.name).toBe("folderA");
            expect(f0.path).toBe("/folderA");
            expect(f0.isExpanded).toBe(false);
            expect(f0.folders.length).toBe(0); // not loaded yet

            f0.expand(true);
            expect(f0.folders.length).toBe(2);
            expect(f0.isExpanded).toBe(true);
            const f00 = f0.folders[0];
            expect(f00.name).toBe("folderA.A");
            expect(f00.path).toBe("/folderA/folderA.A");
            expect(f00.isExpanded).toBe(false);
            expect(f00.folders!.length).toBe(0); // not loaded yet
        });

        it("should load sub-store on-demand (init:expanded)", async () => {
            store = createStore({ $store: FolderStore, data: Data1, parent: null, expanded: true });
            expect(store.isExpanded).toBe(true);
            expect(store.name).toBe("root");
            expect(store.path).toBe("/");
            expect(store.files.join(", ")).toBe("file1, file2");
            expect(store.folders.length).toBe(2);
            const f0 = store.folders[0];
            expect(f0.name).toBe("folderA");
            expect(f0.path).toBe("/folderA");
            expect(f0.isExpanded).toBe(false);
            expect(f0.folders.length).toBe(0); // not loaded yet

            f0.expand(true);
            expect(f0.folders.length).toBe(2);
            expect(f0.isExpanded).toBe(true);
            const f00 = f0.folders[0];
            expect(f00.name).toBe("folderA.A");
            expect(f00.path).toBe("/folderA/folderA.A");
            expect(f00.isExpanded).toBe(false);
            expect(f00.folders.length).toBe(0); // not loaded yet
        });
    });

    describe("Actions", () => {
        it("should support expand all", async () => {
            store = createStore({ $store: FolderStore, data: Data1, parent: null, expanded: false });
            store.expandAll(true);
            expect(store.isExpanded).toBe(true);
            expect(store.folders[0].isExpanded).toBe(true);
            expect(store.folders[0].folders[0].isExpanded).toBe(true);
            expect(store.folders[0].folders[1].isExpanded).toBe(true);
            expect(store.folders[1].isExpanded).toBe(true);
            expect(store.folders[1].folders[0].isExpanded).toBe(true);
        });

        it("should support collapse all", async () => {
            store = createStore({ $store: FolderStore, data: Data1, parent: null, expanded: false });
            store.expandAll(true);
            store.expandAll(false);
            expect(store.isExpanded).toBe(false);
            expect(store.folders[0].isExpanded).toBe(false);
            expect(store.folders[0].folders[0].isExpanded).toBe(false);
            expect(store.folders[0].folders[1].isExpanded).toBe(false);
            expect(store.folders[1].isExpanded).toBe(false);
            expect(store.folders[1].folders[0].isExpanded).toBe(false);
        });

        it("should reflect name changes in the folder path", async () => {
            store = createStore({ $store: FolderStore, data: Data1, parent: null, expanded: false });
            store.expandAll(true);
            const f0 = store.folders[0];
            const f01 = f0.folders[1];
            expect(f01.path).toBe("/folderA/folderA.B");
            f01.setName("NAME01");
            expect(f01.path).toBe("/folderA/NAME01");
            f0.setName("NAME0");
            expect(f01.path).toBe("/NAME0/NAME01");
        });
    });
});
