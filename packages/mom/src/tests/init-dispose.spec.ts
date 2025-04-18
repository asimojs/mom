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

    describe("Sync init components", () => {
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

        it("should call init immediately after load", async () => {
            const testA = mom.load({ $cpt: TestA }, { context });

            expect(testA.$ns).toBe("");
            expect(testA.value).toBe("initial value + after createModel + after init");
            expect(testA.$ready).toBe(true);
            await testA.$initComplete;
            expect(testA.$ready).toBe(true);
            expect(testA.value).toBe("initial value + after createModel + after init"); // unchanged
        });

        it("should dispose", async () => {
            const testA = mom.load({ $cpt: TestA }, { context });
            expect(testA.value).toBe("initial value + after createModel + after init");
            testA.$dispose();
            expect(testA.value).toBe("initial value + after createModel + after init + after dispose");
        });
    });

    describe("Async init components", () => {
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

        it("should handle $initComplete", async () => {
            const testB = mom.load({ $cpt: TestB }, { context });

            expect(testB.value).toBe("initial value + after createModel + init start");
            expect(testB.$ready).toBe(false);
            expect(testB.$disposed).toBe(false);
            await testB.$initComplete;
            expect(testB.$ready).toBe(true);
            expect(testB.$disposed).toBe(false);
            expect(testB.value).toBe("initial value + after createModel + init start + after init");
        });

        it("should dispose during init", async () => {
            const testB = mom.load({ $cpt: TestB }, { context });
            expect(testB.$ready).toBe(false);
            testB.$dispose();
            expect(testB.$ready).toBe(false);
            expect(testB.$disposed).toBe(true);
            expect(testB.value).toBe("initial value + after createModel + init start + after dispose");
        });

        it("should dispose after init", async () => {
            const testB = mom.load({ $cpt: TestB }, { context });
            expect(testB.$ready).toBe(false);
            await testB.$initComplete;
            expect(testB.$ready).toBe(true);
            testB.$dispose();
            expect(testB.$ready).toBe(false);
            expect(testB.$disposed).toBe(true);
            expect(testB.value).toBe("initial value + after createModel + init start + after init + after dispose");
        });
    });
});
