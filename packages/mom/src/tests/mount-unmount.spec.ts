import { MomLoadOptions, MomModel, RO } from "../mom.types";
import { mom } from "../mom";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { asm, AsmContext } from "@asimojs/asimo";

describe("Mom mount+unmount", () => {
    let options: MomLoadOptions;

    beforeEach(() => {
        options = {
            context: asm.createChildContext("test:MomInitDispose"),
        };
    });

    describe("Delayed mount", () => {
        interface LinkedListModel extends MomModel {
            $props: {
                value: string;
            };
            $actions: {
                createNext(v: string): void;
                deleteNext(): void;
            };
            next: RO<LinkedListModel> | null;
        }

        const LinkedList = mom.component<LinkedListModel>((m, props) => {
            const model = m.createModel({
                initialModel: {
                    next: null,
                },
                actions: {
                    createNext(v: string) {
                        if (!model.next) {
                            model.next = m.mount({
                                $cpt: LinkedList,
                                value: `${props.value}+${v}`,
                            });
                        }
                    },
                    deleteNext() {
                        model.next = m.unmount(model.next);
                    },
                },
                dispose() {
                    props.value += "D";
                },
            });
        });

        it("should mount child components", async () => {
            const c = mom.load({ $cpt: LinkedList, value: "A" }, options);

            expect(c.$props.value).toBe("A");
            expect(c.next).toBe(null);

            c.$actions.createNext("B");
            expect(c.next?.$ready).toBe(true);
            expect(c.next?.$props.value).toBe("A+B");

            c.next!.$actions.createNext("C");
            expect(c.next!.next!.$props.value).toBe("A+B+C");
            expect(c.next!.next!.next).toBe(null);
        });

        it("should allow update of child component props", async () => {
            const c = mom.load({ $cpt: LinkedList, value: "A" }, options);

            c.$actions.createNext("B");
            expect(c.next?.$props.value).toBe("A+B");

            c.next!.$props.value = "NEWVALUE"; // not readonly as it is a prop
            // c.next = null; // not authorized: readonly
            expect(c.next?.$props.value).toBe("NEWVALUE");
        });

        it("should dispose child components", async () => {
            const a = mom.load({ $cpt: LinkedList, value: "A" }, options);
            a.$actions.createNext("B");
            const b = a.next!;
            b.$actions.createNext("C");
            const c = b.next!;
            expect(c.$props.value).toBe("A+B+C");

            a.$actions.deleteNext();
            expect(a.next).toBe(null);
            expect(a.$props.value).toBe("A");
            expect(a.$ready).toBe(true);
            expect(a.$disposed).toBe(false);

            expect(b.$disposed).toBe(true);
            expect(b.$ready).toBe(false);
            expect(b.$props.value).toBe("A+BD");
            expect(b.next).not.toBe(null);

            expect(c.$disposed).toBe(true);
            expect(c.$ready).toBe(false);
            expect(c.$props.value).toBe("A+B+CD");
            expect(c.next).toBe(null);
        });
    });

    describe("Startup mount child components", () => {
        interface TestCptModel extends MomModel {
            $props: {
                depth: number;
            };
            $actions: {
                reset(): void;
            };
            msg: string;
            next: RO<TestCptModel> | null;
        }

        const TestCpt = mom.component<TestCptModel>((m, props) => {
            const depth = props.depth;
            const model = m.createModel({
                initialModel: {
                    msg: "",
                    next: depth > 0 ? m.mount({ $cpt: TestCpt, depth: depth - 1 }) : null,
                },
                actions: {
                    reset() {
                        model.$props.depth = 0;
                        model.next = m.unmount(model.next);
                    },
                },
                init() {
                    model.msg = "INITIALIZED";
                },
                dispose() {
                    model.msg = "DISPOSED";
                },
            });
        });

        it("should mount sub components", async () => {
            const c = mom.load({ $cpt: TestCpt, depth: 3 }, options);

            expect(c.next).not.toBe(null);
            expect(c.next!.next!).not.toBe(null);
            expect(c.next!.next!.next).not.toBe(null);
            expect(c.next!.next!.next!.$ready).toBe(true);
            expect(c.next!.next!.next!.next).toBe(null);
        });

        it("should unmount components", async () => {
            const c = mom.load({ $cpt: TestCpt, depth: 3 }, options);
            const c1 = c.next!;
            const c2 = c1.next!;
            const c3 = c2.next!;

            expect(c1.msg).toBe("INITIALIZED");
            expect(c2.msg).toBe("INITIALIZED");
            expect(c3.msg).toBe("INITIALIZED");

            c.$actions.reset();
            expect(c.next).toBe(null);
            expect(c1.next).not.toBe(null);
            expect(c2.next).not.toBe(null);
            expect(c3.next).toBe(null);

            expect(c1.$ready).toBe(false);
            expect(c2.$ready).toBe(false);
            expect(c3.$ready).toBe(false);

            expect(c1.$disposed).toBe(true);
            expect(c2.$disposed).toBe(true);
            expect(c3.$disposed).toBe(true);

            expect(c1.msg).toBe("DISPOSED");
            expect(c2.msg).toBe("DISPOSED");
            expect(c3.msg).toBe("DISPOSED");
        });
    });
});
