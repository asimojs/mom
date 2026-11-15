---
title: createStore
description: Instantiate a root store
---

Creates a **root** store instance. Root stores are not attached to any parent — they're the entry points of a store hierarchy.

## Signature

```typescript
function createStore<SD extends StoreDef>(
    storeFactory: StoreFactory<SD>,
    params?: SD["params"] & { context?: Container<any> }
): Store<SD>;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `storeFactory` | `StoreFactory<SD>` | The factory created by `defineStore` |
| `params` | `SD["params"] & { context? }` | Optional store params, plus an optional `context` override |

The `context` property lets you pass a custom IoC container instead of the default `rootContext`. This is primarily used in tests.

## Returns

`Store<SD>` — the store instance with the observable model and metadata.

## Examples

### Basic usage

```typescript
import { createStore } from "@asimojs/mom";
import { Counter } from "./counter/store";

const store = createStore(Counter, { value: 42, minFormatDigits: 3 });
```

### In a React component

```tsx
import { useState } from "react";
import { createStore } from "@asimojs/mom";

function App() {
    const [store] = useState(() => createStore(Counter, { value: 0 }));
    return <CounterView store={store} />;
}
```

### With a custom context (for testing)

```typescript
import { createContainer } from "@asimojs/asimo";
import { createStore, rootContext } from "@asimojs/mom";

const testContext = createContainer({
    name: "test",
    extends: [rootContext],
    services: [fakeTimeController.factory],
});

const store = createStore(CountDown, { context: testContext, autoStart: true });
```

## Notes

- Use `createStore` only for **root** stores. For child stores inside a parent factory, use [`store.mount()`](/mom/api-reference/store-context#mount).
- The store is created synchronously — `onInit` runs immediately after but may be async.
- Wrap in `useState` when used inside React components to avoid recreation on re-renders.
- Dispose root stores with [`disposeStore()`](/mom/api-reference/disposestore) when they're no longer needed.
