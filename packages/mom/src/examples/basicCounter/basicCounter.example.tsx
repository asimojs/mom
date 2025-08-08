import { createStore } from "@/mom";
import { BasicCounterStore } from "./basicCounter";
import { BasicCounterView } from "./basicCounter.view";
import { useState } from "react";

export const HelloBasicCounter = () => {
    const [store] = useState(() => createStore({ $store: BasicCounterStore }));
    return (
        <div>
            Basic Counter: <BasicCounterView store={store} />
        </div>
    );
};
