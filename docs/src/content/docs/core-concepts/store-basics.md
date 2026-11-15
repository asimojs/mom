---
title: Store Basics
description: defineStore, initModel, params, computed values, and ViewProps
---

## Module structure

By convention, a mom module lives in a folder named after the store, with standardized file names:

```
counter/
├── store.types.ts     # Public API (types + IID)
├── store.ts           # Implementation (factory)
├── store.view.tsx     # React component(s)
└── store.spec.ts      # Tests
```

The folder name is the identifier; the files are named by role.

## Simple stores (no explicit types)

Types are **optional** in mom. Simple stores can be defined without a separate types file — `defineStore` infers the model type from the return value of `initModel()`:

```typescript
// simpleCounter/store.ts
import { defineStore } from "@asimojs/mom";

export const SimpleCounter = defineStore((store) => {
    const model = store.initModel({
        value: 0,
        increment(quantity = 1) {
            model.value += quantity;
        },
    });
    return model;
});

// The store type is inferred automatically
export type SimpleCounterStore = ReturnType<typeof SimpleCounter>;
```

This is all you need for a working store — no types file, no `StoreDef`, no IID. The factory function must **return** the result of `initModel()` for inference to work. Params can be typed inline:

```typescript
export const SimpleCounter = defineStore((store, params: { startValue?: number }) => {
    const model = store.initModel({
        value: params.startValue ?? 0,
        increment(quantity = 1) {
            model.value += quantity;
        },
    });
    return model;
});
```

This lightweight form works well for small, self-contained stores — especially child stores that are only used by their parent.

## Typed store definitions

For larger stores, or stores that need to be loaded dynamically through [asimo](/mom/core-concepts/dependency-inversion), you should define an explicit **store definition** with a types file. This provides:

- A clear, readable contract for the store's public API
- A `Store` type usable by views and parent stores
- An IID for dependency injection and progressive loading

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
        /** Increment the counter by the given quantity - default: 1 */
        increment(quantity?: number): void;
        /** Reset the counter to a given value - default: 0 */
        reset(value?: number): void;
    };
};

export type CounterStore = Store<CounterDef>;
export const CounterIID = storeIId<CounterDef>("myapp.counter");
```

A store definition has two sections:

- **`params`** — optional input passed when creating the store
- **`model`** — the observable data and actions exposed to views and parent stores

The file also exports:
- **`CounterStore`** — the public store type (model + metadata like `#ready`, `#id`, etc.)
- **`CounterIID`** — an interface identifier that binds a namespace string to the type, enabling progressive loading and dependency injection

## Store implementation with `defineStore`

With an explicit definition, the implementation file passes the IID to `defineStore`:

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

Key points:

- **`defineStore(IID, fn)`** takes the store IID and a creation function — the IID provides typing and registers the factory on `rootContext`
- **`store.initModel(obj)`** creates the MobX observable model — this is a typed wrapper over `makeAutoObservable`
- **`params`** is fully typed from the definition and passed as the second argument
- **Computed values** use standard JavaScript getters (`get formattedValue()`) — MobX detects these automatically
- **Actions** are regular methods that mutate the model — MobX wraps them in transactions

## Params

Params let you configure a store at creation time:

```typescript
// Pass params when creating a root store
const store = createStore(Counter, { value: 42, minFormatDigits: 3 });

// Or when mounting a child store
const child = store.mount(Counter, { value: 10 });
```

Params are fully typed — TypeScript will flag invalid or missing required params.

## Computed values

MobX computed properties are derived values that update automatically when their dependencies change. In mom, they're expressed as getters on the model:

```typescript
const model = store.initModel({
    value: 0,
    get formattedValue() {
        return String(model.value).padStart(2, "0");
    },
});
```

`formattedValue` will be recalculated whenever `model.value` changes, and views that read it will re-render automatically.

## The view with `ViewProps`

Mom provides a `ViewProps<S>` type for view components:

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

`ViewProps<S>` provides:
- `store` — a deep-readonly reference to the store (prevents accidental mutations from the view)
- `className` — an optional CSS class name

## Mounting in a React app

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

The `useState` wrapper ensures the store is created once and persists across re-renders.

## Why separate types?

Keeping types in a dedicated file serves two purposes:

1. **Readability** — for non-trivial stores, the types file provides a quick overview of the store's public API without reading the implementation
2. **Progressive loading** — parent stores must only import *types* from child stores (not implementations), otherwise all child code loads eagerly. Type-only imports are erased at compile time, preserving code splitting

## Next

[Lifecycle →](/mom/core-concepts/lifecycle)
