import { createStore, defineStore, disposeStore } from "../mom";
import { Store } from "../mom.types";
import { describe, expect, it } from "vitest";

describe("defineStore overloads", () => {
    describe("Return-model, no IID, no params", () => {
        const TestStore = defineStore((store) => {
            const model = store.initModel({
                value: "hello",
                upper() {
                    model.value = model.value.toUpperCase();
                },
            });
            return model;
        });

        it("should infer the model type and work correctly", async () => {
            const s = createStore(TestStore);
            expect(s.value).toBe("hello");
            expect(s.$ready).toBe(true);
            s.upper();
            expect(s.value).toBe("HELLO");
            disposeStore(s);
        });
    });

    describe("Return-model, no IID, with typed params", () => {
        const TestStore = defineStore((store, params: { initial: number }) => {
            const model = store.initModel({
                value: params.initial,
                increment() {
                    model.value++;
                },
            });
            return model;
        });

        it("should pass params type to createStore", async () => {
            const s = createStore(TestStore, { initial: 42 });
            expect(s.value).toBe(42);
            s.increment();
            expect(s.value).toBe(43);
            disposeStore(s);
        });
    });

    describe("Return-model, with string IID", () => {
        interface IIDTestDef {
            model: { value: number };
        }

        const TestStore = defineStore<IIDTestDef>("test.returnModel", (store) => {
            store.initModel({
                value: 10,
            });
        });

        it("should set the namespace correctly", async () => {
            const s = createStore(TestStore);
            expect(s.$namespace).toBe("test.returnModel");
            expect(s.value).toBe(10);
            disposeStore(s);
        });
    });

    describe("Return-model with lifecycle hooks", () => {
        const TestStore = defineStore((store, params: { initial: string }) => {
            let disposed = false;

            const model = store.initModel({
                value: params.initial,
                suffix: "",
                get isDisposed() {
                    return disposed;
                },
            });

            store.onInit(() => {
                model.suffix = "!";
            });

            store.onDispose(() => {
                disposed = true;
            });

            return model;
        });

        it("should run onInit and onDispose", async () => {
            const s = createStore(TestStore, { initial: "hi" });
            await s.$initComplete;
            expect(s.value).toBe("hi");
            expect(s.suffix).toBe("!");
            expect(s.isDisposed).toBe(false);

            disposeStore(s);
            await s.$disposeComplete;
            expect(s.isDisposed).toBe(true);
        });
    });

    describe("Return-model with child stores", () => {
        const ChildStore = defineStore((store, params: { name: string }) => {
            return store.initModel({
                name: params.name,
            });
        });

        const ParentStore = defineStore((store) => {
            const model = store.initModel({
                child: store.mount(ChildStore, { name: "child1" }) as Store<{ params: { name: string }; model: { name: string } }> | null,
                removeChild() {
                    model.child = store.unmount(model.child);
                },
            });
            return model;
        });

        it("should mount and unmount child stores", async () => {
            const s = createStore(ParentStore);
            expect(s.child?.name).toBe("child1");
            expect(s.child?.$ready).toBe(true);

            s.removeChild();
            expect(s.child).toBe(null);

            disposeStore(s);
        });
    });

    describe("Existing void-return pattern (regression)", () => {
        interface TestDef {
            model: {
                value: string;
            };
        }

        const TestStore = defineStore<TestDef>((store) => {
            store.initModel({
                value: "legacy",
            });
        });

        it("should still work with explicit type parameter and void return", async () => {
            const s = createStore(TestStore);
            expect(s.value).toBe("legacy");
            expect(s.$ready).toBe(true);
            disposeStore(s);
        });
    });
});
