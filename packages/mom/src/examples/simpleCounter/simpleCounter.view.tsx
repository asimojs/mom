import { observer } from "mobx-react-lite";
import { SimpleCounterStore } from "./simpleCounter.types";
import { ViewProps } from "@/mom.types";

export const SimpleCounterView = observer(({ store, className }: ViewProps<SimpleCounterStore>) => {
    return (
        <div className={className}>
            <div>Counter: {store.value}</div>
            <button onClick={() => store.increment(1)}>Increment</button>
            <button onClick={() => store.increment(-1)}>Decrement</button>
        </div>
    );
});
