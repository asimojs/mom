import { disposeStore, loadStore, storeFactory } from "../mom";
import { describe, expect, it } from "vitest";
import { runInAction } from "mobx";

describe("Mom init+dispose", () => {
    interface TestDef {
        model: {
            value: string;
        };
    }

    describe("Sync init", () => {
        const TestStoreA = storeFactory<TestDef>((m) => {
            const model = m.makeAutoObservableModel({
                value: "initial value",
            });
            model.value += " + after storeFactory";
        });

        const TestStoreB = storeFactory<TestDef>((m) => {
            const model = m.makeAutoObservableModel({
                value: "initial value",
            });
            m.makeAutoObservableController({
                init() {
                    // sync init
                    model.value += " + after init";
                },
                dispose() {
                    model.value += " + after dispose";
                },
            });
            model.value += " + after storeFactory";
        });

        it("should set the store ready if no init", async () => {
            let initCompleteCount = 0;
            const store = loadStore({ $store: TestStoreA });
            store["#initComplete"].then(() => {
                initCompleteCount++;
            });
            expect(store["#namespace"]).toBe("");
            expect(store["#state"]).toBe("READY");
            expect(store.value).toBe("initial value + after storeFactory");
            expect(store["#ready"]).toBe(true);
            expect(initCompleteCount).toBe(0);
            await store["#initComplete"];
            expect(initCompleteCount).toBe(1);
            expect(store["#ready"]).toBe(true);
            expect(store.value).toBe("initial value + after storeFactory"); // unchanged
        });

        it("should call init immediately after load", async () => {
            let initCompleteCount = 0;
            const store = loadStore({ $store: TestStoreB });
            store["#initComplete"].then(() => {
                initCompleteCount++;
            });

            expect(store["#namespace"]).toBe("");
            expect(store["#state"]).toBe("READY"); // sync init -> already called
            expect(store.value).toBe("initial value + after storeFactory + after init");
            expect(store["#ready"]).toBe(true);
            expect(initCompleteCount).toBe(0);
            await store["#initComplete"];
            expect(initCompleteCount).toBe(1);
            expect(store["#ready"]).toBe(true);
            expect(store.value).toBe("initial value + after storeFactory + after init"); // unchanged
        });

        it("should dispose stores with no explicit dispose methods", async () => {
            let diposeCompleteCount = 0;
            const store = loadStore({ $store: TestStoreA });
            expect(store.value).toBe("initial value + after storeFactory");
            store["#disposeComplete"].then(() => {
                diposeCompleteCount++;
            });
            expect(store["#ready"]).toBe(true);
            expect(store["#state"]).toBe("READY");
            disposeStore(store);
            expect(diposeCompleteCount).toBe(0);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
            expect(store.value).toBe("initial value + after storeFactory");
            await store["#disposeComplete"];
            expect(diposeCompleteCount).toBe(1);
        });

        it("should dispose stores with explicit dispose methods", async () => {
            let diposeCompleteCount = 0;
            const store = loadStore({ $store: TestStoreB });
            expect(store.value).toBe("initial value + after storeFactory + after init");
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
            expect(store.value).toBe("initial value + after storeFactory + after init + after dispose");
            await store["#disposeComplete"];
            expect(diposeCompleteCount).toBe(1);
        });

        // TODO: init with sub components
    });

    describe("Async init", () => {
        const TestStoreC = storeFactory<TestDef>((m) => {
            const model = m.makeAutoObservableModel({
                value: "initial value",
            });
            m.makeAutoObservableController({
                async init() {
                    model.value += " + init start";
                    await Promise.resolve();
                    runInAction(() => {
                        model.value += " + after init";
                    });
                },
                dispose() {
                    model.value += " + after dispose";
                },
            });
            model.value += " + after storeFactory";
        });

        it("should handle #initComplete", async () => {
            const store = loadStore({ $store: TestStoreC });

            expect(store.value).toBe("initial value + after storeFactory + init start");
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("INITIALIZING");
            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);
            expect(store["#state"]).toBe("READY");
            expect(store.value).toBe("initial value + after storeFactory + init start + after init");
        });

        it("should support terminate during init", async () => {
            const store = loadStore({ $store: TestStoreC });

            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("INITIALIZING");
            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
            expect(store.value).toBe("initial value + after storeFactory + init start + after dispose");
        });

        it("should dispose after init complete", async () => {
            const store = loadStore({ $store: TestStoreC });
            expect(store["#ready"]).toBe(false);
            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);
            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
            expect(store.value).toBe("initial value + after storeFactory + init start + after init + after dispose");
        });
    });

    describe("Generator function init", () => {
        const TestStoreC = storeFactory<TestDef>((m) => {
            const model = m.makeAutoObservableModel({
                value: "initial value",
            });
            m.makeAutoObservableController({
                *init() {
                    model.value += " + init start";
                    yield Promise.resolve();
                    // no need for runInAction() here
                    model.value += " + after init";
                },
                dispose() {
                    model.value += " + after dispose";
                },
            });
            model.value += " + after storeFactory";
        });

        it("should handle #initComplete", async () => {
            const store = loadStore({ $store: TestStoreC });

            expect(store.value).toBe("initial value + after storeFactory + init start");
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("INITIALIZING");
            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);
            expect(store["#state"]).toBe("READY");
            expect(store.value).toBe("initial value + after storeFactory + init start + after init");
        });

        it("should support terminate during init", async () => {
            const store = loadStore({ $store: TestStoreC });

            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("INITIALIZING");
            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
            expect(store.value).toBe("initial value + after storeFactory + init start + after dispose");
        });

        it("should dispose after init complete", async () => {
            const store = loadStore({ $store: TestStoreC });
            expect(store["#ready"]).toBe(false);
            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);
            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
            expect(store.value).toBe("initial value + after storeFactory + init start + after init + after dispose");
        });
    });
});
