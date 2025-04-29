import { MomComponent, MomModel, interfaceId } from "../../mom.types";
import { CounterModel } from "../counter/counter.types";

export const CounterListIID = interfaceId<MomComponent<CounterListModel>>("mom.examples.counterList");

/** Headless counter */
export interface CounterListModel extends MomModel {
    $props: {
        /** The number of counters in the list */
        size: number;
        /** The value used when creating a new counter */
        defaultValue?: number;
        /** Change callback */
        onChange?(): void;
    };
    $actions: {
        /** Add a new counter to the list */
        addCounter(): void;
        /** Remove a counter */
        removeCounter(c: CounterModel): void;
        /** Reset all counters to their initial value */
        reset(): void;
    };
    /** The list of counters */
    counters: CounterModel[];
}
