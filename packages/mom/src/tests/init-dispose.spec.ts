import { MomModel } from "../mom.types";
import { mom } from "../mom";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { asm, AsmContext } from "@asimojs/asimo";

describe("Mom init+dispose", () => {
    interface TestModel extends MomModel {
        value: string;
    }
    let context: AsmContext;

    beforeEach(() => {
        context = asm.createChildContext("test:MomInitDispose");
    });

    describe("Sync init", () => {
        let modelBeforeCreate: any = null;

        const TestA = mom.component<TestModel>((m) => {
            modelBeforeCreate = m.model;
            const model = m.createModel({
                initialModel: {
                    value: "initial value",
                },
                init() {
                    // sync init
                    model.value += " + after init";
                },
                dispose() {
                    model.value += " + after dispose";
                },
            });
            model.value += " + after createModel";
        });

        it("should be called immediately after load", async () => {
            const testA = mom.load({ $cpt: TestA }, { context });

            expect(testA.$ns).toBe("");
            expect(testA.value).toBe("initial value + after createModel + after init");
            expect(testA.$initialized).toBe(true);
            await testA.$initComplete;
            expect(testA.$initialized).toBe(true);
            expect(testA.value).toBe("initial value + after createModel + after init"); // unchanged
        });

        // TODO dispose during init - e.g. if component creation conditions are not met
    });

    describe("Async init", () => {
        let modelBeforeCreate: any = null;

        const TestB = mom.component<TestModel>((m) => {
            modelBeforeCreate = m.model;
            const model = m.createModel({
                initialModel: {
                    value: "initial value",
                },
                async init() {
                    model.value += " + init start";
                    await Promise.resolve();
                    // sync init
                    model.value += " + after init";
                },
                dispose() {
                    model.value += " + after dispose";
                },
            });
            model.value += " + after createModel";
        });

        it("should finish with $initComplete", async () => {
            const testB = mom.load({ $cpt: TestB }, { context });

            expect(testB.value).toBe("initial value + after createModel + init start");
            expect(testB.$initialized).toBe(false);
            await testB.$initComplete;
            expect(testB.$initialized).toBe(true);
            expect(testB.value).toBe("initial value + after createModel + init start + after init");
        });
    });
});
