import { storeFactory } from "@/mom";
import { CounterListSID } from "./counterList.types";
import { CounterStore } from "../counter/counter.types";
import { Counter } from "../counter/counter";

export const CounterList = storeFactory(CounterListSID, (m, params) => {
    const model = m.makeAutoObservableModel({
        $defaultValue: 1,
        counters: [],
        get totalCount() {
            return model.counters.reduce((count, counter) => count + counter.value, 0);
        },

        /** Add a new counter to the list */
        addCounter() {
            model.counters.push(m.mount({ $store: Counter, value: model.$defaultValue }));
        },
        /** Remove a counter */
        removeCounter(c: CounterStore) {
            const idx = model.counters.findIndex((v) => v === c);
            if (idx) {
                const counter = model.counters[idx];
                m.unmount(counter);
                model.counters.splice(idx, 1);
            }
        },
        /** Reset all counters to their initial value */
        reset() {
            model.counters.forEach((c) => c.reset());
        },
    });

    m.makeAutoObservableController({
        init() {
            const initialSize = params?.size ?? 0;
            for (let i = 0; initialSize > i; i++) {
                model.addCounter();
            }
        },
    });
});
