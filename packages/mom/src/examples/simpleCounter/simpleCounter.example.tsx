import { createStore } from "@/mom";
import { SimpleCounter } from "./simpleCounter";
import { SimpleCounterView } from "./simpleCounter.view";
import { useState } from "react";

export const HelloSimpleCounter = () => {
    const [store] = useState(() => createStore({ $store: SimpleCounter }));
    return (
        <div>
            Simple Counter: <SimpleCounterView store={store} />
        </div>
    );
};
