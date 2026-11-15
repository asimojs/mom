---
title: disposeStore
description: Dispose a root store
---

Disposes a root store created with `createStore`. Triggers the full disposal lifecycle: disposes reactions, recursively disposes all child stores, and calls `onDispose` callbacks.

## Signature

```typescript
function disposeStore<SD extends StoreDef>(store: Store<SD>): boolean;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `store` | `Store<SD>` | The root store to dispose |

## Returns

`boolean` — `true` if the store was successfully disposed, `false` if it was not a root store or was already disposed.

## Example

```typescript
import { createStore, disposeStore } from "@asimojs/mom";
import { Counter } from "./counter/store";

const store = createStore(Counter, { value: 0 });

// ... use the store ...

disposeStore(store);
// store["#state"] is now "DISPOSED"
```

### In React with cleanup

```tsx
import { useEffect, useState } from "react";
import { createStore, disposeStore } from "@asimojs/mom";

function App() {
    const [store] = useState(() => createStore(Counter));

    useEffect(() => {
        return () => { disposeStore(store); };
    }, [store]);

    return <CounterView store={store} />;
}
```

## Behavior

1. Disposes all MobX reactions (autorun, reaction) registered on the store
2. Recursively disposes all child stores (depth-first)
3. Calls the store's `onDispose` callback (if any)
4. Transitions `#state` through `DISPOSING` → `DISPOSED`
5. Sets `#ready` to `false`
6. Resolves the `#disposeComplete` promise

## Notes

- Only works on root stores created with `createStore`. For child stores, use [`store.unmount()`](/mom/api-reference/store-context#unmount).
- Disposal may be async if `onDispose` returns a promise. Use `await store["#disposeComplete"]` to wait.
- After disposal, model data can still be read but the store is no longer functional.
