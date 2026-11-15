---
title: Counter List
description: Parent-child collection — dynamic mount/unmount and computed aggregation
---

A parent store managing a dynamic list of child Counter stores, demonstrating **collections** and **computed aggregation**.

## Features used

- Parent-child store hierarchy
- Dynamic `store.mount()` and `store.unmount()`
- Computed property aggregating child values (`totalCount`)
- `$id` for React list keys

## Types

```typescript
// counterList/store.types.ts
import { Store, storeIId } from "@asimojs/mom";
import { CounterStore } from "../counter/store.types";

type CounterListDef = {
    model: {
        /** All counter instances */
        counters: CounterStore[];
        /** Sum of all counter values */
        totalCount: number;
        /** Add a new counter with optional initial value */
        addCounter(value?: number): void;
        /** Remove a counter by reference */
        removeCounter(counter: CounterStore): void;
        /** Reset all counters */
        reset(): void;
    };
};

export type CounterListStore = Store<CounterListDef>;
export const CounterListIID = storeIId<CounterListDef>("mom.examples.counterList");
```

## Store

```typescript
// counterList/store.ts
import { defineStore } from "@asimojs/mom";
import { CounterListIID } from "./store.types";
import { Counter } from "../counter/store";

export const CounterList = defineStore(CounterListIID, (store) => {
    const model = store.initModel({
        counters: [] as ReturnType<typeof Counter>[],

        get totalCount() {
            return model.counters.reduce((sum, c) => sum + c.value, 0);
        },

        addCounter(value = 0) {
            model.counters.push(store.mount(Counter, { value }));
        },

        removeCounter(counter) {
            const index = model.counters.indexOf(counter);
            if (index >= 0) {
                store.unmount(counter);
                model.counters.splice(index, 1);
            }
        },

        reset() {
            for (const counter of model.counters) {
                counter.reset();
            }
        },
    });
});
```

### Key patterns

- **`totalCount`** is a computed property that sums all child counter values — it updates automatically when any child's `value` changes
- **`addCounter`** mounts a new child and pushes it to the observable array
- **`removeCounter`** unmounts the child (triggering disposal) and removes it from the array
- **`reset`** calls an action on every child — the parent coordinates children

## View

```tsx
// counterList/store.view.tsx
import { observer } from "mobx-react-lite";
import { ViewProps } from "@asimojs/mom";
import { CounterListStore } from "./store.types";
import { CounterView } from "../counter/store.view";

export const CounterListView = observer(({ store }: ViewProps<CounterListStore>) => (
    <div>
        <div>Total: {store.totalCount}</div>
        <button onClick={() => store.addCounter()}>Add Counter</button>
        <button onClick={() => store.reset()}>Reset All</button>

        {store.counters.map((counter) => (
            <div key={counter.$id}>
                <CounterView store={counter} />
                <button onClick={() => store.removeCounter(counter)}>Remove</button>
            </div>
        ))}
    </div>
));
```

## Test

```typescript
import { createStore, disposeStore } from "@asimojs/mom";
import { CounterList } from "./store";

describe("CounterList", () => {
    it("should track total across children", () => {
        const store = createStore(CounterList);

        store.addCounter(10);
        store.addCounter(20);
        expect(store.totalCount).toBe(30);

        store.counters[0].increment(5);
        expect(store.totalCount).toBe(35);

        store.removeCounter(store.counters[0]);
        expect(store.totalCount).toBe(20);
        expect(store.counters.length).toBe(1);

        disposeStore(store);
    });
});
```
