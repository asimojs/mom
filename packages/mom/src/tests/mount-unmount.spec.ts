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
                    deleteNext() {},
                },
            });
        });

        it("should mount child components", async () => {
            const c = mom.load({ $cpt: LinkedList, value: "A" }, options);

            expect(c.$props.value).toBe("A");
            expect(c.next).toBe(null);

            c.$actions.createNext("B");
            expect(c.next?.$initialized).toBe(true);
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
    });

    describe("Startup mount", () => {
        interface TestCptModel extends MomModel {
            $props: {
                depth: number;
            };
            next: RO<TestCptModel> | null;
        }

        const TestCpt = mom.component<TestCptModel>((m, props) => {
            const depth = props.depth;
            const model = m.createModel({
                initialModel: {
                    next: depth > 0 ? m.mount({ $cpt: TestCpt, depth: depth - 1 }) : null,
                },
            });
        });

        it("should mount child componentw", async () => {
            const c = mom.load({ $cpt: TestCpt, depth: 3 }, options);

            expect(c.next).not.toBe(null);
            expect(c.next!.next!).not.toBe(null);
            expect(c.next!.next!.next).not.toBe(null);
            expect(c.next!.next!.next!.$initialized).toBe(true);
            expect(c.next!.next!.next!.next).toBe(null);
        });
    });
});
