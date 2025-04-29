import { Store, storeIId } from "@/mom.types";

export type Counter = Store<CounterDef>;
export const CounterSID = storeIId<CounterDef>("mom.examples.counter");

/** Counter with init parameter + computed value + reset button */
type CounterDef = {
    params: {
        /** The initial counter value - default: 0 */
        value?: number;
        /** Minimal number of digits in the formatted display - default: 2 */
        minFormatDigits?: number;
        /** The value that should be used when the reset button is pressed - default: 0 */
        resetValue?: number;
    };
    model: {
        /** The counter value - default: 0 */
        $value: number;
        /** The value that should be used when the reset button is pressed - default: params.resetValue */
        $resetValue: number;
        /** Counter value formatted according to minFormatDigits - e.g. "007" */
        formattedValue: string;
        /** Increment the counter by the given quantity (can be negative) - default: 1 */
        increment(quantity?: number): void;
        /** Reset the counter to $resetValue */
        reset(): void;
    };
};
