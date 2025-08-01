import { observer } from "mobx-react-lite";
import { BasicCounter } from "./basicCounter.types";
import { ViewProps } from "@/mom.types";

export const BasicCounterView = observer(({ store }: ViewProps<BasicCounter>) => {
    return (
        <div className="counter">
            <div>Counter: {store.$value}</div>
            <button onClick={() => store.increment(1)}>Increment</button>
            <button onClick={() => store.increment(-1)}>Decrement</button>
        </div>
    );
});
