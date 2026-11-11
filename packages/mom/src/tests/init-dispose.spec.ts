import { disposeStore, createStore, defineStore } from "../mom";
import { describe, expect, it } from "vitest";
import { runInAction } from "mobx";

describe("Mom init+dispose", () => {
    interface TestDef {
        model: {
            value: string;
        };
    }

    describe("Sync init", () => {
        const TestStoreA = defineStore<TestDef>((store) => {
            const model = store.initModel({
                value: "initial value",
            });
            model.value += " + after defineStore";
        });

        const TestStoreB = defineStore<TestDef>((store) => {
            const model = store.initModel({
                value: "initial value",
            });
            store.onInit(() => {
                // sync init
                model.value += " + after init";
            });
            store.onDispose(() => {
                model.value += " + after dispose";
            });
            model.value += " + after defineStore";
        });

        it("should set the store ready if no init", async () => {
            let initCompleteCount = 0;
            const store = createStore({ $store: TestStoreA });
            store["#initComplete"].then(() => {
                initCompleteCount++;
            });
            expect(store["#namespace"]).toBe("");
            expect(store["#state"]).toBe("READY");
            expect(store.value).toBe("initial value + after defineStore");
            expect(store["#ready"]).toBe(true);
            expect(initCompleteCount).toBe(0);
            await store["#initComplete"];
            expect(initCompleteCount).toBe(1);
            expect(store["#ready"]).toBe(true);
            expect(store.value).toBe("initial value + after defineStore"); // unchanged
        });

        it("should call init immediately after load", async () => {
            let initCompleteCount = 0;
            const store = createStore({ $store: TestStoreB });
            store["#initComplete"].then(() => {
                initCompleteCount++;
            });

            expect(store["#namespace"]).toBe("");
            expect(store["#state"]).toBe("READY"); // sync init -> already called
            expect(store.value).toBe("initial value + after defineStore + after init");
            expect(store["#ready"]).toBe(true);
            expect(initCompleteCount).toBe(0);
            await store["#initComplete"];
            expect(initCompleteCount).toBe(1);
            expect(store["#ready"]).toBe(true);
            expect(store.value).toBe("initial value + after defineStore + after init"); // unchanged
        });

        it("should dispose stores with no explicit dispose methods", async () => {
            let diposeCompleteCount = 0;
            const store = createStore({ $store: TestStoreA });
            expect(store.value).toBe("initial value + after defineStore");
            store["#disposeComplete"].then(() => {
                diposeCompleteCount++;
            });
            expect(store["#ready"]).toBe(true);
            expect(store["#state"]).toBe("READY");
            disposeStore(store);
            expect(diposeCompleteCount).toBe(0);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
            expect(store.value).toBe("initial value + after defineStore");
            await store["#disposeComplete"];
            expect(diposeCompleteCount).toBe(1);
        });

        it("should dispose stores with explicit dispose methods", async () => {
            let diposeCompleteCount = 0;
            const store = createStore({ $store: TestStoreB });
            expect(store.value).toBe("initial value + after defineStore + after init");
            store["#disposeComplete"].then(() => {
                diposeCompleteCount++;
            });
            expect(store["#ready"]).toBe(true);
            expect(store["#state"]).toBe("READY");
            expect(diposeCompleteCount).toBe(0);
            disposeStore(store);
            expect(diposeCompleteCount).toBe(0);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
            expect(store.value).toBe("initial value + after defineStore + after init + after dispose");
            await store["#disposeComplete"];
            expect(diposeCompleteCount).toBe(1);
        });

        // init with sub components tested with FolderStore example
    });

    describe("Async init & dispose", () => {
        const TestStoreC = defineStore<TestDef>((store) => {
            const model = store.initModel({
                value: "initial value",
            });
            store.onInit(async () => {
                model.value += " + init start";
                await Promise.resolve();
                runInAction(() => {
                    model.value += " + after init";
                });
            });
            store.onDispose(async () => {
                model.value += " + dispose start";
                await Promise.resolve();
                runInAction(() => {
                    model.value += " + after dispose";
                });
            });
            model.value += " + after defineStore";
        });

        it("should handle #initComplete", async () => {
            const store = createStore({ $store: TestStoreC });

            expect(store.value).toBe("initial value + after defineStore + init start");
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("INITIALIZING");
            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);
            expect(store["#state"]).toBe("READY");
            expect(store.value).toBe("initial value + after defineStore + init start + after init");
        });

        it("should support terminate during init", async () => {
            const store = createStore({ $store: TestStoreC });

            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("INITIALIZING");
            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSING");
            expect(store.value).toBe("initial value + after defineStore + init start + dispose start");
            await store["#disposeComplete"];
            expect(store.value).toBe(
                "initial value + after defineStore + init start + dispose start + after init + after dispose",
            );
        });

        it("should dispose after init complete", async () => {
            const store = createStore({ $store: TestStoreC });
            expect(store["#ready"]).toBe(false);
            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);
            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSING");
            expect(store.value).toBe("initial value + after defineStore + init start + after init + dispose start");
            await store["#disposeComplete"];
            expect(store.value).toBe(
                "initial value + after defineStore + init start + after init + dispose start + after dispose",
            );
        });
    });

    describe("Generator function init & dispose", () => {
        const TestStoreC = defineStore<TestDef>((store) => {
            const model = store.initModel({
                value: "initial value",
            });
            store.onInit(async () => {
                model.value += " + init start";
                await Promise.resolve();
                runInAction(() => {
                    model.value += " + after init";
                });
            });
            store.onDispose(async () => {
                model.value += " + dispose start";
                await Promise.resolve();
                runInAction(() => {
                    model.value += " + after dispose";
                });
            });
            model.value += " + after defineStore";
        });

        it("should handle #initComplete", async () => {
            const store = createStore({ $store: TestStoreC });

            expect(store.value).toBe("initial value + after defineStore + init start");
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("INITIALIZING");
            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);
            expect(store["#state"]).toBe("READY");
            expect(store.value).toBe("initial value + after defineStore + init start + after init");
        });

        it("should support terminate during init", async () => {
            const store = createStore({ $store: TestStoreC });

            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("INITIALIZING");
            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSING");
            expect(store.value).toBe("initial value + after defineStore + init start + dispose start");
            await store["#disposeComplete"];
            expect(store.value).toBe(
                "initial value + after defineStore + init start + dispose start + after init + after dispose",
            );
        });

        it("should dispose after init complete", async () => {
            const store = createStore({ $store: TestStoreC });
            expect(store["#ready"]).toBe(false);
            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);
            expect(store["#state"]).toBe("READY");
            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSING");
            expect(store.value).toBe("initial value + after defineStore + init start + after init + dispose start");
            await store["#disposeComplete"];
            expect(store.value).toBe(
                "initial value + after defineStore + init start + after init + dispose start + after dispose",
            );
        });
    });
});
