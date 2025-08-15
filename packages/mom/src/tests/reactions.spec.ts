import { disposeStore, createStore, storeFactory } from "../mom";
import { beforeEach, describe, expect, it } from "vitest";
import { runInAction } from "mobx";

describe("Mom init+dispose", () => {
    let logs: string[];
    interface TestDef {
        model: {
            value: string;
            msg1: string;
            msg2: string;
            setValue(v: string): void;
        };
    }

    beforeEach(() => {
        logs = [];
    });

    describe("Autorun", () => {
        const AutorunTest = storeFactory<TestDef>((m) => {
            const model = m.makeAutoObservableModel({
                value: "initial value",
                msg1: "",
                msg2: "",

                setValue(v: string) {
                    model.value = "BEFORE"; // no effect as the setter in an action
                    model.value = v;
                },
            });

            m.autorun(() => {
                logs.push(`Model value: ${model.value}`);
            });
        });

        it("should run when value changes and stop after dispose", async () => {
            const store = createStore({ $store: AutorunTest });

            expect(logs).toEqual(["Model value: initial value"]);

            store.setValue("New value");
            expect(logs).toEqual(["Model value: initial value", "Model value: New value"]);

            store.setValue("New value2");
            expect(logs).toEqual(["Model value: initial value", "Model value: New value", "Model value: New value2"]);

            disposeStore(store);

            store.setValue("New value3");
            expect(logs).toEqual(["Model value: initial value", "Model value: New value", "Model value: New value2"]);
        });
    });

    describe("Reactions", () => {
        // section#reaction
        const ReactionTest = storeFactory<TestDef>((m) => {
            const model = m.makeAutoObservableModel({
                value: "initial value",
                msg1: "",
                msg2: "",

                setValue(v: string) {
                    model.value = "BEFORE"; // no effect as the setter in an action
                    model.value = v;
                },
            });

            // reaction: (model.value) => model.msg1 (equivalent to a computed prop in this case)
            m.reaction(
                () => {
                    if (model.value === "A") {
                        return "Value is A";
                    }
                    return "Value is not A";
                },
                (v) => {
                    model.msg1 = v;
                },
            );

            // reaction: (model.value, model.msg1) -> model.msg2 (equivalent to a computed prop in this case)
            m.reaction(
                () => ({ v1: model.value, v2: model.msg1 }),
                (data) => {
                    model.msg2 = `${data.v1}: ${data.v2}`;
                },
            );
        });
        // /section#reaction

        it("should run chain reactions and stop after dispose", async () => {
            const store = createStore({ $store: ReactionTest });
            expect(store.value).toBe("initial value");
            expect(store.msg1).toBe("Value is not A");
            expect(store.msg2).toBe("initial value: Value is not A");

            store.setValue("A");
            expect(store.value).toBe("A");
            expect(store.msg1).toBe("Value is A");
            expect(store.msg2).toBe("A: Value is A");

            store.setValue("B");
            expect(store.value).toBe("B");
            expect(store.msg1).toBe("Value is not A");
            expect(store.msg2).toBe("B: Value is not A");

            disposeStore(store);
            expect(store["#ready"]).toBe(false);
            store.setValue("C");
            expect(store.value).toBe("C");
            expect(store.msg1).toBe("Value is not A"); // unchanged
            expect(store.msg2).toBe("B: Value is not A"); // unchanged
        });
    });
});
