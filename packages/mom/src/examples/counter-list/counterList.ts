import { mom } from "../../mom";
import { Counter } from "../counter/counter";
import { CounterModel } from "../counter/counter.types";
import { CounterListIID } from "./counterList.types";

export const CounterList = mom.component(CounterListIID, (m, props) => {
    if (props.defaultValue === undefined) {
        props.defaultValue = 0;
    }
    if (props.size < 1) {
        props.size = 1;
    }

    const model = m.createModel({
        initialModel: {
            counters: [],
        },
        actions: {
            /** Add a new counter to the list */
            addCounter() {
                appendCounter();
            },
            /** Remove a counter */
            removeCounter(c: CounterModel) {
                const idx = model.counters.findIndex((v) => v === c);
                if (idx) {
                    const counter = model.counters[idx];
                    m.unmount(counter);
                    model.counters.splice(idx, 1);
                    props.size = model.counters.length;
                }
            },
            /** Reset all counters to their initial value */
            reset() {
                for (const counter of model.counters) {
                    counter.$actions.reset();
                }
            },
        },
        init() {
            for (let i = 0; props.size > i; i++) {
                appendCounter(false);
            }
        },
    });

    function appendCounter(updateSize = true) {
        model.counters.push(m.mount({ $cpt: Counter, value: props.defaultValue, onChange }));
        if (updateSize) {
            props.size = model.counters.length;
        }
    }

    function onChange() {
        props.onChange?.();
    }
});
