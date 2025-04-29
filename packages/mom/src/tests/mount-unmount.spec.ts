import { loadStore, storeFactory } from "../mom";
import { describe, expect, it } from "vitest";
import { Store } from "../mom.types";

describe("Mom mount+unmount", () => {
    describe("Delayed mount", () => {
        interface LinkedListDef {
            params: {
                value: string;
            };
            model: {
                $value: string; // rw prop
                next: Store<LinkedListDef> | null;
                createNext(v: string): void;
                deleteNext(): void;
            };
        }

        const LinkedListStore = storeFactory<LinkedListDef>((m, props) => {
            const model = m.makeAutoObservableModel({
                $value: props.value,
                next: null,
                createNext(v: string) {
                    if (!model.next) {
                        model.next = m.mount({
                            $store: LinkedListStore,
                            value: `${props.value}+${v}`,
                        });
                    }
                },
                deleteNext() {
                    model.next = m.unmount(model.next);
                },
            });
            m.makeAutoObservableController({
                dispose() {
                    model.$value += "D";
                },
            });
        });

        it("should mount child components", async () => {
            const store = loadStore({ $store: LinkedListStore, value: "A" });

            expect(store.$value).toBe("A");
            expect(store.next).toBe(null);

            store.createNext("B");
            expect(store.next?.["#ready"]).toBe(true);
            expect(store.next?.$value).toBe("A+B");

            store.next!.createNext("C");
            expect(store.next!.next!.$value).toBe("A+B+C");
            expect(store.next!.next!.next).toBe(null);
        });

        it("should allow update of child component props", async () => {
            const store = loadStore({ $store: LinkedListStore, value: "A" });

            store.createNext("B");
            expect(store.next?.$value).toBe("A+B");

            store.next!.$value = "NEWVALUE"; // not readonly as it is a prop
            // store.next = null; // not authorized: readonly
            expect(store.next?.$value).toBe("NEWVALUE");
        });

        it("should dispose child components", async () => {
            const a = loadStore({ $store: LinkedListStore, value: "A" });
            a.createNext("B");
            const b = a.next!;
            b.createNext("C");
            const c = b.next!;
            expect(b.$value).toBe("A+B");
            expect(c.$value).toBe("A+B+C");

            a.deleteNext();
            expect(a.next).toBe(null);
            expect(a.$value).toBe("A");
            expect(a["#ready"]).toBe(true);
            expect(a["#state"]).toBe("READY");

            expect(b["#state"]).toBe("DISPOSED");
            expect(b["#ready"]).toBe(false);
            expect(b.$value).toBe("A+BD");
            expect(b.next).not.toBe(null);

            expect(c["#state"]).toBe("DISPOSED");
            expect(c["#ready"]).toBe(false);
            expect(c.$value).toBe("A+B+CD");
            expect(c.next).toBe(null);
        });
    });

    // describe("Startup mount child components", () => {
    //     interface TestCptModel extends MomModel {
    //         $props: {
    //             depth: number;
    //         };
    //         $actions: {
    //             reset(): void;
    //         };
    //         msg: string;
    //         next: RO<TestCptModel> | null;
    //     }

    //     const TestCpt = mom.component<TestCptModel>((m, props) => {
    //         const depth = props.depth;
    //         const model = m.createModel({
    //             initialModel: {
    //                 msg: "",
    //                 next: depth > 0 ? m.mount({ $cpt: TestCpt, depth: depth - 1 }) : null,
    //             },
    //             actions: {
    //                 reset() {
    //                     model.depth = 0;
    //                     model.next = m.unmount(model.next);
    //                 },
    //             },
    //             init() {
    //                 model.msg = "INITIALIZED";
    //             },
    //             dispose() {
    //                 model.msg = "DISPOSED";
    //             },
    //         });
    //     });

    //     it("should mount sub components", async () => {
    //         const c = mom.load({ $cpt: TestCpt, depth: 3 }, options);

    //         expect(c.next).not.toBe(null);
    //         expect(c.next!.next!).not.toBe(null);
    //         expect(c.next!.next!.next).not.toBe(null);
    //         expect(c.next!.next!.next!.$ready).toBe(true);
    //         expect(c.next!.next!.next!.next).toBe(null);
    //     });

    //     it("should unmount components", async () => {
    //         const c = mom.load({ $cpt: TestCpt, depth: 3 }, options);
    //         const c1 = c.next!;
    //         const c2 = c1.next!;
    //         const c3 = c2.next!;

    //         expect(c1.msg).toBe("INITIALIZED");
    //         expect(c2.msg).toBe("INITIALIZED");
    //         expect(c3.msg).toBe("INITIALIZED");

    //         c.reset();
    //         expect(c.next).toBe(null);
    //         expect(c1.next).not.toBe(null);
    //         expect(c2.next).not.toBe(null);
    //         expect(c3.next).toBe(null);

    //         expect(c1.$ready).toBe(false);
    //         expect(c2.$ready).toBe(false);
    //         expect(c3.$ready).toBe(false);

    //         expect(c1.$disposed).toBe(true);
    //         expect(c2.$disposed).toBe(true);
    //         expect(c3.$disposed).toBe(true);

    //         expect(c1.msg).toBe("DISPOSED");
    //         expect(c2.msg).toBe("DISPOSED");
    //         expect(c3.msg).toBe("DISPOSED");
    //     });
    // });
});
