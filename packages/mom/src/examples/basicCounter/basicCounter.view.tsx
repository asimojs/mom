import { observer } from "mobx-react-lite";
import { BasicCounterStore } from "./basicCounter.types";
import { ViewProps } from "@/mom.types";

export const BasicCounterView = observer(({ store, className }: ViewProps<BasicCounterStore>) => {
    return (
        <div className={className}>
            <div>Counter: {store.value}</div>
            <button onClick={() => store.increment(1)}>Increment</button>
            <button onClick={() => store.increment(-1)}>Decrement</button>
        </div>
    );
});
