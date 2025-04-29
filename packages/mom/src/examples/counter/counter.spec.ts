import { beforeEach, describe, expect, it } from "vitest";
import { asm, AsmContext } from "@asimojs/asimo";
import { loadStore } from "@/mom";
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
            const counter = loadStore({ $store: CounterStore, value: 42, minFormatDigits: 3 });

            expect(counter["#namespace"]).toBe(CounterSID.ns);
            expect(counter["#namespace"]).toBe("mom.examples.counter");
            expect(counter["#context"].name).toBe("asm"); // TODO
            expect(counter["#context"].path).toBe("/asm"); // TODO: /asm/test:Counter
            expect(counter.$value).toBe(42);
            expect(counter.formattedValue).toBe("042");
            expect(counter.$resetValue).toBe(0);
        });

        it("should support no params", async () => {
            const counter = loadStore({ $store: CounterStore });

            expect(counter["#namespace"]).toBe(CounterSID.ns);
            expect(counter["#context"].name).toBe("asm");
            expect(counter["#context"].path).toBe("/asm");
            expect(counter.$value).toBe(0);
            expect(counter.formattedValue).toBe("00");
        });
    });

    describe("Actions", () => {
        it("should increment or set the counter", async () => {
            const counter = loadStore({ $store: CounterStore, value: 42 });

            expect(counter.$value).toBe(42);

            counter.increment();
            expect(counter.$value).toBe(43);

            // counter.nbrOfChanges=2; // not possible -> nbrOfChanges is readonly
            counter.$value = 9;
            expect(counter.$value).toBe(9);

            counter.increment(5);
            expect(counter.$value).toBe(9 + 5);
            expect(counter.formattedValue).toBe("14");

            counter.increment(-7);
            expect(counter.$value).toBe(7);
            expect(counter.formattedValue).toBe("07");

            counter.increment(0); // no changes
            expect(counter.$value).toBe(7);

            counter.$value = -8; // value can be negative
            expect(counter.$value).toBe(-8);
        });

        it("reset the counter to its initial value", async () => {
            const counter = loadStore({ $store: CounterStore, value: 3 });

            expect(onChangeValues).toEqual([]);
            expect(counter.$value).toBe(3);
            expect(counter.formattedValue).toBe("03");

            counter.$value = 9;
            expect(counter.$value).toBe(9);

            expect(counter.$resetValue).toBe(0);
            counter.reset();
            expect(counter.$value).toBe(0);
            expect(counter.formattedValue).toBe("00");

            counter.$resetValue = 1;
            counter.reset();
            expect(counter.$value).toBe(1);
            expect(counter.formattedValue).toBe("01");
        });
    });
});
