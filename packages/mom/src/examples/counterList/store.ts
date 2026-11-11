import { defineStore } from "@/mom";
import { CounterListIID } from "./store.types";
import { CounterStore } from "../counter/store.types";
import { Counter } from "../counter/store";

export const CounterList = defineStore(CounterListIID, (store, params) => {
    const model = store.initModel({
        $defaultValue: 1,
        counters: [],
        get totalCount() {
            return model.counters.reduce((count, counter) => count + counter.value, 0);
        },

        /** Add a new counter to the list */
        addCounter() {
            model.counters.push(store.mount({ $store: Counter, value: model.$defaultValue }));
        },
        /** Remove a counter */
        removeCounter(c: CounterStore) {
            const idx = model.counters.findIndex((v) => v === c);
            if (idx) {
                const counter = model.counters[idx];
                store.unmount(counter);
                model.counters.splice(idx, 1);
            }
        },
        /** Reset all counters to their initial value */
        reset() {
            model.counters.forEach((c) => c.reset());
        },
    });

    store.makeAutoObservableController({
        init() {
            const initialSize = params?.size ?? 0;
            for (let i = 0; initialSize > i; i++) {
                model.addCounter();
            }
        },
    });
});
