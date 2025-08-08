import { createStore } from "@/mom";
import { CounterStore } from "./counter";
import { CounterView } from "./counter.view";
import { useState } from "react";

// section#main
export const HelloCounter = () => {
    const [store] = useState(() => createStore({ $store: CounterStore, value: 42, minFormatDigits: 3 }));
    return (
        <div>
            Basic Counter: <CounterView store={store} />
        </div>
    );
};
// /section#main
