---
title: Store Metadata
description: "$id, $namespace, $state, $ready, $initComplete, $disposeComplete"
---

Every store instance includes metadata properties prefixed with `$` to avoid collisions with model properties. These are defined by the `StoreMetaData` interface.

## Properties

### `$namespace`

```typescript
readonly "$namespace": string
```

The namespace from the store's IID (e.g. `"myapp.counter"`). Empty string if no IID was provided to `defineStore`.

### `$id`

```typescript
readonly "$id": string
```

A unique instance identifier combining the namespace with a sequential counter:

```
"myapp.counter#1"
"myapp.counter#2"
"mom.examples.folder#42"
```

Useful as a React `key` in lists and for debugging.

### `$state`

```typescript
readonly "$state": "INITIALIZING" | "READY" | "DISPOSING" | "DISPOSED"
```

The current lifecycle state:

| State | Description |
|-------|-------------|
| `INITIALIZING` | Store created, async init not yet complete |
| `READY` | Init complete, store is operational |
| `DISPOSING` | Disposal started, may be async |
| `DISPOSED` | Fully disposed, no longer functional |

### `$ready`

```typescript
readonly "$ready": boolean
```

`true` when `$state` is `"READY"`, `false` otherwise. Convenience property for view components:

```tsx
if (!store.$ready) return <div>Loading...</div>;
```

### `$initComplete`

```typescript
readonly "$initComplete": Promise<void>
```

Resolves when the store transitions from `INITIALIZING` to `READY`. Useful in tests:

```typescript
const store = createStore(MyStore);
await store.$initComplete;
expect(store.$ready).toBe(true);
```

### `$disposeComplete`

```typescript
readonly "$disposeComplete": Promise<void>
```

Resolves when the store transitions to `DISPOSED`:

```typescript
disposeStore(store);
await store.$disposeComplete;
expect(store.$state).toBe("DISPOSED");
```

## Access syntax

The `$`-prefixed metadata properties are accessed with dot notation:

```typescript
store.$id           // ✓
store.$ready        // ✓
store.$state        // ✓
```

## Observability

`$state` and `$ready` are **MobX observable** — views wrapped with `observer` will re-render when they change. The other metadata properties (`$id`, `$namespace`) are set once at creation and don't change.
