import { createStore } from "@/mom";
import { BasicCounter } from "./basicCounter";
import { BasicCounterView } from "./basicCounter.view";
import { useState } from "react";

export const HelloBasicCounter = () => {
    const [store] = useState(() => createStore({ $store: BasicCounter }));
    return (
        <div>
            Basic Counter: <BasicCounterView store={store} />
        </div>
    );
};
