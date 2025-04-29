import { Store, storeIId } from "@/mom.types";
import { Counter } from "../counter/counter.types";

export type CounterList = Store<CounterListDef>;
export const CounterListSID = storeIId<CounterListDef>("mom.examples.counterList");

/** Store exposing a list of counters */
type CounterListDef = {
    params: {
        /** The initial number of counters in the list */
        size: number;
        /** Change callback */
        onChange?(): void;
    };
    model: {
        /** The sum of all counter values in the list */
        totalCount: number;
        /** The value used when creating a new counter - can be changed dynamically */
        $defaultValue: number;
        /** The list of counters */
        counters: Counter[];

        /** Add a new counter to the list */
        addCounter(): void;
        /** Remove a counter */
        removeCounter(c: Counter): void;
        /** Reset all counters to their initial value */
        reset(): void;
    };
};
