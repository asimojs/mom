import { observer } from "mobx-react-lite";
import { Counter } from "./counter.types";
import { ViewProps } from "@/mom.types";

// section#main
export const CounterView = observer(({ store, className }: ViewProps<Counter>) => {
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
