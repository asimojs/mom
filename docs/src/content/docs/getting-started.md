---
title: Getting Started
description: Install mom and create your first store
---

## Prerequisites

- **React** 18+ (or Preact)
- **TypeScript** 5+
- **MobX** basics — mom builds on MobX observables, but you don't need deep expertise to get started

## Installation

```bash
pnpm add @asimojs/mom mobx mobx-react-lite react
```

> `@asimojs/asimo` (the IoC library mom uses internally) is installed automatically as a dependency.

## Create your first store

A mom store is a small, self-contained unit of observable state and actions. Let's build a minimal counter.

### 1. Define the store types

By convention each store lives in its own folder. The types file declares the public API:

```typescript
// simpleCounter/store.types.ts
import { Store, storeIId } from "@asimojs/mom";

type SimpleCounterDef = {
    model: {
        /** The counter value */
        value: number;
        /** Increment the counter */
        increment(quantity?: number): void;
    };
};

export type SimpleCounterStore = Store<SimpleCounterDef>;
export const SimpleCounterIID = storeIId<SimpleCounterDef>("myapp.simpleCounter");
```

### 2. Implement the store factory

The implementation file exports a **factory** — a function mom calls to create store instances:

```typescript
// simpleCounter/store.ts
import { defineStore } from "@asimojs/mom";
import { SimpleCounterIID } from "./store.types";

export const SimpleCounter = defineStore(SimpleCounterIID, (store) => {
    const model = store.initModel({
        value: 1,
        increment(quantity = 1) {
            model.value += quantity;
        },
    });
});
```

`store.initModel()` wraps your object with MobX's `makeAutoObservable`, making every property observable and every method an action.

### 3. Create the view

The React component receives the store as a prop and is wrapped with MobX's `observer` for automatic re-rendering:

```tsx
// simpleCounter/store.view.tsx
import { observer } from "mobx-react-lite";
import { ViewProps } from "@asimojs/mom";
import { SimpleCounterStore } from "./store.types";

export const SimpleCounterView = observer(({ store }: ViewProps<SimpleCounterStore>) => (
    <div>
        <div>Counter: {store.value}</div>
        <button onClick={() => store.increment(1)}>Increment</button>
        <button onClick={() => store.increment(-1)}>Decrement</button>
    </div>
));
```

### 4. Mount it in your app

Use `createStore` to instantiate a root store. Wrap it in `useState` so it survives React re-renders:

```tsx
// App.tsx
import { createStore } from "@asimojs/mom";
import { SimpleCounter } from "./simpleCounter/store";
import { SimpleCounterView } from "./simpleCounter/store.view";
import { useState } from "react";

export default function App() {
    const [store] = useState(() => createStore(SimpleCounter));
    return <SimpleCounterView store={store} />;
}
```

That's it — a fully reactive counter with typed props and zero hooks in the view component.

## What's next

- [**Why Stores?**](/mom/core-concepts/why-stores) — understand the MVVM pattern behind mom
- [**Store Basics**](/mom/core-concepts/store-basics) — params, computed values, and the `ViewProps` type
- [**Lifecycle**](/mom/core-concepts/lifecycle) — async init, dispose, and the store state machine
