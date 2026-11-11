import { Store, storeIId } from "@/mom.types";

// section#main
type CounterDef = {
    params: {
        /** The initial counter value - default: 0 */
        value?: number;
        /** Minimal number of digits in the formatted display - default: 2 */
        minFormatDigits?: number;
    };
    model: {
        /** The counter value - default: 0 */
        value: number;
        /** Counter value formatted according to minFormatDigits - e.g. "007" */
        formattedValue: string;
        /** Increment the counter by the given quantity (can be negative) - default: 1 */
        increment(quantity?: number): void;
        /** Reset the counter to a given value (default: 0) */
        reset(value?: number): void;
    };
};
// /section#main

export type CounterStore = Store<CounterDef>;
export const CounterIID = storeIId<CounterDef>("mom.examples.counter");
