import { mom } from "../../mom";
import { beforeEach, describe, expect, it } from "vitest";
import { Counter } from "./counter";
import { CounterIID } from "./counter.types";
import { asm, AsmContext } from "@asimojs/asimo";
import { MomLoadOptions } from "@/mom.types";

describe("Counter", () => {
    let context: AsmContext,
        options: MomLoadOptions,
        onChangeValues: number[] = [];

    function onChange(v: number) {
        onChangeValues.push(v);
    }

    beforeEach(() => {
        onChangeValues = [];
        context = asm.createChildContext("test:Counter");
        options = {
            context,
        };
    });

    // TODO: computed value with nbrOfDigits based on $props.value (reactivity on props)

    describe("Load", () => {
        it("should support value prop", async () => {
            const counter = mom.load({ $cpt: Counter, value: 42 }, { context });

            expect(counter.$ns).toBe(CounterIID.ns);
            expect(counter.$context.name).toBe("test:Counter");
            expect(counter.$context.path).toBe("/asm/test:Counter");
            expect(counter.$props.value).toBe(42);
            expect(counter.$props.onChange).toBe(undefined);
            expect(counter.nbrOfChanges).toBe(0);
        });

        it("should support no value prop", async () => {
            const counter = mom.load({ $cpt: Counter });

            expect(counter.$ns).toBe(CounterIID.ns);
            expect(counter.$context.name).toBe("asm");
            expect(counter.$context.path).toBe("/asm");
            expect(counter.$props.value).toBe(0);
            expect(counter.$props.onChange).toBe(undefined);
            expect(counter.nbrOfChanges).toBe(0);
        });
    });

    describe("Actions", () => {
        it("should increment or set the counter", async () => {
            const counter = mom.load({ $cpt: Counter, value: 42, onChange }, options);

            expect(onChangeValues).toEqual([]);
            expect(counter.$props.value).toBe(42);

            counter.$actions.increment();
            expect(counter.$props.value).toBe(43);
            expect(counter.nbrOfChanges).toBe(1);
            expect(onChangeValues).toEqual([43]);

            // counter.nbrOfChanges=2; // not possible -> nbrOfChanges is readonly
            counter.$props.value = 9;
            expect(counter.$props.value).toBe(9);
            expect(counter.nbrOfChanges).toBe(1); // doesn't triger an onChange as direct update
            expect(onChangeValues).toEqual([43]);

            counter.$actions.increment(5);
            expect(counter.$props.value).toBe(9 + 5);
            expect(counter.nbrOfChanges).toBe(2);
            expect(onChangeValues).toEqual([43, 14]);

            counter.$actions.increment(-7);
            expect(counter.$props.value).toBe(7);
            expect(counter.nbrOfChanges).toBe(3);
            expect(onChangeValues).toEqual([43, 14, 7]);

            counter.$actions.increment(0); // no changes
            expect(counter.$props.value).toBe(7);
            expect(counter.nbrOfChanges).toBe(3);
            expect(onChangeValues).toEqual([43, 14, 7]);

            counter.$actions.setValue(-8); // value can be negative
            expect(counter.$props.value).toBe(-8);
            expect(counter.nbrOfChanges).toBe(4);
            expect(onChangeValues).toEqual([43, 14, 7, -8]);
        });

        it("reset the counter to its initial value", async () => {
            const counter = mom.load({ $cpt: Counter, value: 3, onChange }, options);

            expect(onChangeValues).toEqual([]);
            expect(counter.$props.value).toBe(3);

            counter.$actions.setValue(9);
            expect(counter.$props.value).toBe(9);
            expect(counter.nbrOfChanges).toBe(1);
            expect(onChangeValues).toEqual([9]);

            counter.$actions.reset();
            expect(counter.$props.value).toBe(3);
            expect(counter.nbrOfChanges).toBe(2);
            expect(onChangeValues).toEqual([9, 3]);
        });
    });
});
