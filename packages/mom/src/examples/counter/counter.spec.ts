import { beforeEach, describe, expect, it } from "vitest";
import { asm, AsmContext } from "@asimojs/asimo";
import { createStore } from "@/mom";
import { CounterStore } from "./counter";
import { CounterSID } from "./counter.types";

describe("Counter", () => {
    let context: AsmContext,
        onChangeValues: number[] = [];

    function onChange(v: number) {
        onChangeValues.push(v);
    }

    beforeEach(() => {
        onChangeValues = [];
        context = asm.createChildContext("test:Counter");
    });

    describe("Load", () => {
        it("should support value prop", async () => {
            const counter = createStore({ $store: CounterStore, value: 42, minFormatDigits: 3 });

            expect(counter["#namespace"]).toBe(CounterSID.ns);
            expect(counter["#namespace"]).toBe("mom.examples.counter");
            expect(counter["#id"].match(/^mom\.examples\.counter\#(\d+)$/)?.[1]).not.toBeUndefined();
            expect(counter["#context"].name).toBe("asm"); // TODO
            expect(counter["#context"].path).toBe("/asm"); // TODO: /asm/test:Counter
            expect(counter.value).toBe(42);
            expect(counter.formattedValue).toBe("042");
        });

        it("should support no params", async () => {
            const counter = createStore({ $store: CounterStore });

            expect(counter["#namespace"]).toBe(CounterSID.ns);
            expect(counter["#context"].name).toBe("asm");
            expect(counter["#context"].path).toBe("/asm");
            expect(counter.value).toBe(0);
            expect(counter.formattedValue).toBe("00");
        });
    });

    describe("Actions", () => {
        it("should increment or set the counter", async () => {
            const counter = createStore({ $store: CounterStore, value: 42 });

            expect(counter.value).toBe(42);

            counter.increment();
            expect(counter.value).toBe(43);

            counter.increment(5);
            expect(counter.value).toBe(43 + 5);
            expect(counter.formattedValue).toBe("48");

            counter.increment(-41);
            expect(counter.value).toBe(7);
            expect(counter.formattedValue).toBe("07");

            counter.increment(0); // no changes
            expect(counter.value).toBe(7);
        });

        it("reset the counter", async () => {
            const counter = createStore({ $store: CounterStore, value: 3 });

            expect(onChangeValues).toEqual([]);
            expect(counter.value).toBe(3);
            expect(counter.formattedValue).toBe("03");

            counter.reset(9);
            expect(counter.value).toBe(9);

            counter.reset();
            expect(counter.value).toBe(0);
            expect(counter.formattedValue).toBe("00");

            counter.reset(1);
            expect(counter.value).toBe(1);
            expect(counter.formattedValue).toBe("01");
        });
    });
});
