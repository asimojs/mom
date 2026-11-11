import { Store, storeIId } from "@/mom.types";

/** SimpleCounter API Definition */
type SimpleCounterDef = {
    model: {
        /** The counter value - default: 1 */
        value: number;
        /** Increment the counter by the given quantity (can be negative) - default: 1 */
        increment(quantity?: number): void;
    };
};

export type SimpleCounterStore = Store<SimpleCounterDef>;
export const SimpleCounterIID = storeIId<SimpleCounterDef>("mom.examples.simpleCounter");
