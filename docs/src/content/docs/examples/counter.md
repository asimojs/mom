---
title: Counter
description: Simple counter store — params, computed values, and formatted display
---

A minimal counter demonstrating **params** and **computed values**.

## Features used

- `defineStore` with IID
- `initModel` with params
- Computed getter (`formattedValue`)
- `ViewProps` type

## Types

```typescript
// counter/store.types.ts
import { Store, storeIId } from "@asimojs/mom";

type CounterDef = {
    params: {
        /** The initial counter value - default: 0 */
        value?: number;
        /** Minimal number of digits in the formatted display - default: 2 */
        minFormatDigits?: number;
    };
    model: {
        /** The counter value */
        value: number;
        /** Counter value formatted according to minFormatDigits - e.g. "007" */
        formattedValue: string;
        /** Increment the counter */
        increment(quantity?: number): void;
        /** Reset the counter */
        reset(value?: number): void;
    };
};

export type CounterStore = Store<CounterDef>;
export const CounterIID = storeIId<CounterDef>("mom.examples.counter");
```

## Store

```typescript
// counter/store.ts
import { defineStore } from "@asimojs/mom";
import { CounterIID } from "./store.types";

export const Counter = defineStore(CounterIID, (store, params) => {
    const minFormatDigits = params.minFormatDigits ?? 2;

    const model = store.initModel({
        value: params.value ?? 0,
        get formattedValue() {
            return String(model.value).padStart(minFormatDigits, "0");
        },
        increment(quantity = 1) {
            model.value += quantity;
        },
        reset(value = 0) {
            model.value = value;
        },
    });
});
```

The `formattedValue` getter is a MobX **computed property** — it recalculates automatically when `model.value` changes.

## View

```tsx
// counter/store.view.tsx
import { observer } from "mobx-react-lite";
import { ViewProps } from "@asimojs/mom";
import { CounterStore } from "./store.types";

export const CounterView = observer(({ store, className }: ViewProps<CounterStore>) => (
    <div className={className}>
        <div>Counter: {store.formattedValue}</div>
        <button onClick={() => store.increment(1)}>Increment</button>
        <button onClick={() => store.increment(-1)}>Decrement</button>
        <button onClick={() => store.reset()}>Reset</button>
    </div>
));
```

## Usage

```tsx
import { createStore } from "@asimojs/mom";
import { Counter } from "./counter/store";
import { CounterView } from "./counter/store.view";
import { useState } from "react";

export function HelloCounter() {
    const [store] = useState(() => createStore(Counter, { value: 42, minFormatDigits: 3 }));
    return <CounterView store={store} />;
}
```

## Test

```typescript
import { createStore, disposeStore } from "@asimojs/mom";
import { Counter } from "./store";

describe("Counter", () => {
    it("should format value with padding", () => {
        const store = createStore(Counter, { value: 7, minFormatDigits: 3 });
        expect(store.formattedValue).toBe("007");
        store.increment();
        expect(store.formattedValue).toBe("008");
        disposeStore(store);
    });

    it("should reset to default", () => {
        const store = createStore(Counter, { value: 10 });
        store.increment(5);
        expect(store.value).toBe(15);
        store.reset();
        expect(store.value).toBe(0);
        disposeStore(store);
    });
});
```
