import { observer } from "mobx-react-lite";
import { CounterStore } from "./counter.types";
import { ViewProps } from "@/mom.types";

// section#main
export const CounterView = observer(({ store, className }: ViewProps<CounterStore>) => {
    return (
        <div className={className}>
            <div>Counter: {store.formattedValue}</div>
            <button onClick={() => store.increment(1)}>Increment</button>
            <button onClick={() => store.increment(-1)}>Decrement</button>
            <button onClick={() => store.reset()}>Reset</button>
        </div>
    );
});
// /section#main
