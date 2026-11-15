---
title: "Lifecycle: Init & Dispose"
description: Store lifecycle states, onInit, onDispose, and async initialization
---

Stores need to run code at creation (e.g. fetch data) and disposal (e.g. clean up timers). Mom provides lifecycle hooks and automatically exposes lifecycle state on every store.

## Lifecycle states

Each store instance transitions through four states, exposed via the `$state` property:

```
INITIALIZING → READY → DISPOSING → DISPOSED
```

| State | Meaning |
|-------|---------|
| `INITIALIZING` | The store was created but async init hasn't completed yet |
| `READY` | Init is complete — this is where the store spends most of its life |
| `DISPOSING` | Disposal has started (may be async) |
| `DISPOSED` | Fully disposed — references should be removed |

The `$ready` boolean is a convenience shorthand — `true` when `$state` is `"READY"`:

```tsx
export const MyStoreView = observer(({ store }: ViewProps<MyStore>) => {
    if (!store.$ready) return <div>Loading...</div>;
    return <div>{/* ready content */}</div>;
});
```

## `onInit` and `onDispose`

Register lifecycle callbacks inside the store factory:

- **`store.onInit(fn)`** — called immediately after the factory function returns
- **`store.onDispose(fn)`** — called when the store is unmounted or disposed

Each can be called at most once per store. Both accept sync or async functions.

```typescript
export const CountDown = defineStore(CountDownIID, (store, params) => {
    const { initValue = 10, intervalMs = 1000, autoStart = false } = params;

    const model = store.initModel({
        value: initValue,
        get isRunning() {
            return state.intervalId > 0;
        },
        start() { /* ... */ },
        stop() { /* ... */ },
        reset() {
            model.value = initValue;
        },
    });

    const state = store.initState({
        intervalId: 0,
    });

    store.onInit(() => {
        autoStart && model.start();
    });

    store.onDispose(() => {
        model.stop();
    });
});
```

### Why `onInit` runs *after* the factory

Mom always creates the store synchronously so the view can render immediately — even before async initialization completes. When `onInit` is synchronous, the store transitions to `READY` before the first render. When it's async, the store starts in `INITIALIZING` and the view should check `$ready`.

## Private state with `initState`

`store.initState(obj)` creates a MobX observable object that is **not** exposed on the store's public model. Use it for internal bookkeeping:

```typescript
const state = store.initState({
    intervalId: 0,
});
```

Like `initModel`, it wraps `makeAutoObservable`. It can only be called once per store.

## Async initialization

For async operations (e.g. data fetching), use an async `onInit` callback:

```typescript
store.onInit(async () => {
    const data = await fetchData();
    runInAction(() => {
        model.items = data;
    });
});
```

**Important:** After an `await`, any model or state mutations must be wrapped in `runInAction()`. This is a MobX requirement — synchronous methods created by `makeAutoObservable` are already actions, but code resuming after `await` runs outside the action context.

## Awaiting lifecycle completion

Two promise properties let you wait for lifecycle transitions:

```typescript
// Wait for init to complete
await store.$initComplete;

// Wait for full disposal
await store.$disposeComplete;
```

These are useful in tests and when parent stores need to coordinate with child store readiness.

## Store metadata recap

Every store exposes these `$`-prefixed metadata properties:

| Property | Type | Description |
|----------|------|-------------|
| `$state` | `"INITIALIZING" \| "READY" \| "DISPOSING" \| "DISPOSED"` | Current lifecycle state |
| `$ready` | `boolean` | `true` when `$state` is `"READY"` |
| `$initComplete` | `Promise<void>` | Resolves when init completes |
| `$disposeComplete` | `Promise<void>` | Resolves when disposal completes |
| `$namespace` | `string` | The IID namespace (e.g. `"myapp.counter"`) |
| `$id` | `string` | Unique instance id (e.g. `"myapp.counter#42"`) |

## Next

[The HMVVM Pattern →](/mom/core-concepts/hmvvm)
