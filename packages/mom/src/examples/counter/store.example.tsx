import { createStore } from "@/mom";
import { Counter } from "./store";
import { CounterView } from "./store.view";
import { useState } from "react";

// section#main
export const HelloCounter = () => {
    const [store] = useState(() => createStore({ $store: Counter, value: 42, minFormatDigits: 3 }));
    return (
        <div>
            Basic Counter: <CounterView store={store} />
        </div>
    );
};
// /section#main
