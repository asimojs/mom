---
title: defineStore
description: Create a store factory
---

Creates a `StoreFactory` — a function that mom calls to produce store instances.

## Signatures

### With IID (recommended)

```typescript
function defineStore<SD extends StoreDef>(
    storeIID: InterfaceId<StoreFactory<SD>> | string,
    createFn: (store: StoreContext<SD>, params: SD["params"]) => void
): StoreFactory<SD>;
```

Registers the factory on [`rootContext`](/mom/api-reference/rootcontext) automatically, enabling progressive loading and IoC resolution.

### With definition type

```typescript
function defineStore<SD extends StoreDef>(
    createFn: (store: StoreContext<SD>, params: SD["params"]) => void
): StoreFactory<SD>;
```

Creates a factory without registering it on rootContext. The `SD` type must be specified explicitly.

### With return-model inference

```typescript
function defineStore<P extends object, M extends object>(
    createFn: (store: InferredStoreContext<P>, params: P) => M
): StoreFactory<StoreDefR<P, M>>;
```

Infers the model type from the return value of `initModel()`. The factory function **must** return the result of `store.initModel()`.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `storeIID` | `InterfaceId \| string` | Optional. Store interface identifier or namespace string |
| `createFn` | `(store, params) => void \| M` | Factory function that sets up the store |

## Returns

`StoreFactory<SD>` — a callable factory with a `#namespace` property.

## Examples

### Standard pattern (with IID)

```typescript
import { defineStore } from "@asimojs/mom";
import { CounterIID } from "./store.types";

export const Counter = defineStore(CounterIID, (store, params) => {
    const model = store.initModel({
        value: params.value ?? 0,
        increment(quantity = 1) { model.value += quantity; },
    });
});
```

### Return-model inference

```typescript
export const TextInput = defineStore((store, params: { value?: string }) => {
    const model = store.initModel({
        value: params.value ?? "",
        setValue(v: string) { model.value = v; },
    });
    return model;  // Must return model for type inference
});

export type TextInputStore = ReturnType<typeof TextInput>;
```

### With string namespace

```typescript
export const Counter = defineStore("myapp.counter", (store, params) => {
    // ...
});
```

## Behavior

1. Calls `createFn` with a fresh `StoreContext` and the provided params
2. The factory function must call `store.initModel()` to create the observable model
3. If an IID is provided, registers a service factory on `rootContext` mapping the IID to this store factory
4. Returns the factory function with `#namespace` set to the IID namespace (or empty string)
