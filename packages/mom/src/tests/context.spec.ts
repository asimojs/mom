import { disposeStore, createStore, storeFactory } from "../mom";
import { describe, expect, it } from "vitest";
import { runInAction } from "mobx";
import { asm, AsmContext, interfaceId } from "@asimojs/asimo";
import { Store, storeIId } from "@/mom.types";

interface TestDef {
    params: {
        depth?: number;
    };
    model: {
        depth: number;
        value: string;
        subStore: TestStore | null;
    };
}
type TestStore = Store<TestDef>;
const TestStoreIID = storeIId<TestDef>("mom.tests.context.TestStore");
const SomeConfigIID = interfaceId<{ depth: number }>("mom.tests.context.SomeConfig");

describe("Mom context", () => {
    let storeContext: AsmContext | null = null;

    const TestStore = storeFactory(TestStoreIID, (m, params) => {
        const depth = params.depth ?? 1;

        storeContext = m.context;

        m.createChildContext();
        m.context.registerObject(SomeConfigIID, { depth });

        m.makeAutoObservableModel({
            depth,
            value: "value " + m.context.get(SomeConfigIID).depth,
            subStore: depth < 1 ? null : m.mount({ $store: TestStore, depth: depth - 1 }),
        });
    });

    describe("Store Factories", () => {
        it("should register test stores in asm", async () => {
            const testStoreFactory = await asm.fetch(TestStoreIID, null);
            expect(testStoreFactory).toBe(TestStore);
        });

        it("should allow to create child context and pass them to child stores", async () => {
            const st1 = createStore({ $store: TestStore });
            expect(st1.value).toBe("value 1");

            expect(st1.subStore?.value).toBe("value 0");
            // the initial context passed to the child store was the store created by the parent
            expect(storeContext!.path.match(/^\/asm\/mom.tests.context.TestStore\#\d+$/)).not.toBeNull();
        });
    });

    describe("createStore", () => {
        it("should use asm as default context", async () => {
            storeContext = null;
            const st1 = createStore({ $store: TestStore, depth: 0 });
            expect(storeContext).toBe(asm);
            expect(st1["#context"].path).toBe(asm.path);
        });

        it("should be possible to call createStore with $context", async () => {
            const c2 = asm.createChildContext("c2");
            expect(c2).not.toBe(asm);

            storeContext = null;
            const st2 = createStore({ $store: TestStore, $context: c2, depth: 0 });
            expect(storeContext).toBe(c2);
            expect(c2.path).toBe("/asm/c2");
            expect(st2["#context"].path).toBe(c2.path); // can't compare refs as #context is a Proxy
        });
    });
});
