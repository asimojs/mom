import { MomComponent, MomModel, interfaceId } from "../../mom.types";

export const CounterIID = interfaceId<MomComponent<CounterModel>>("mom.examples.counter");

/** Headless counter */
export interface CounterModel extends MomModel {
    $props: {
        /** The counter value - default: 0 */
        value?: number;
        /** Change callback */
        onChange?(v: number): void;
    };
    $actions: {
        /** Increment the counter by the given quantity (can be negative) - default: 1 */
        increment(quantity?: number): void;
        /** Set the counter to a specific value */
        setValue(v: number): void;
        /** Reset the counter to the initial value */
        reset(): void;
    };
    /** The number of times actions (and onChange()) have been called */
    nbrOfChanges: number;
}
