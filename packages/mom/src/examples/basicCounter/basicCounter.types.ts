import { Store, storeIId } from "@/mom.types";

export type BasicCounter = Store<BasicCounterDef>;
export const BasicCounterSID = storeIId<BasicCounterDef>("mom.examples.basicCounter");

/** BasicCounter API Definition */
type BasicCounterDef = {
    model: {
        /** The counter value - default: 0 */
        $value: number;
        /** Increment the counter by the given quantity (can be negative) - default: 1 */
        increment(quantity?: number): void;
    };
};
