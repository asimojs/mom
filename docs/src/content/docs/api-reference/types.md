---
title: Types
description: Store, StoreDef, StoreFactory, ViewProps, DeepReadOnly, storeIId, asyncIID
---

Type definitions exported from `@asimojs/mom`.

## `StoreDef`

```typescript
type StoreDef<Params extends object = {}, Model extends object = {}> = {
    params?: Params;
    model?: Model;
};
```

Base type for store definitions. Used as the generic parameter for `defineStore`, `Store`, and `StoreFactory`.

```typescript
type CounterDef = {
    params: { value?: number };
    model: { value: number; increment(): void };
};
```

## `Store<D>`

```typescript
type Store<D extends StoreDef<any, any>> = DeepReadOnly<D["model"] & StoreMetaData>;
```

The public store instance type — the model plus [metadata](/mom/api-reference/store-metadata), wrapped in `DeepReadOnly` to prevent mutations from outside the store.

```typescript
export type CounterStore = Store<CounterDef>;
```

## `StoreFactory<D>`

```typescript
interface StoreFactory<D extends StoreDef<any, any>> {
    readonly "#namespace": string;
    (store: StoreContext<D>, params: D["params"]): Store<D>;
}
```

A callable factory produced by `defineStore`. The `#namespace` property holds the IID namespace string.

## `ViewProps<S>`

```typescript
interface ViewProps<S extends Store<any>> {
    store: DeepReadOnly<S>;
    className?: string;
}
```

Standard props for store view components:

```tsx
const MyView = observer(({ store, className }: ViewProps<MyStore>) => (
    <div className={className}>{store.value}</div>
));
```

## `DeepReadOnly<T>`

```typescript
type DeepReadOnly<T> = T extends (infer R)[]
    ? ReadonlyArray<DeepReadOnly<R>>
    : T extends Function
    ? T
    : T extends object
    ? { readonly [K in keyof T]: DeepReadOnly<T[K]> }
    : T;
```

Recursively makes all properties readonly. Applied to store models to prevent view-side mutations. Functions (actions) are left unchanged.

## `StoreMetaData`

```typescript
interface StoreMetaData {
    readonly "#namespace": string;
    readonly "#id": string;
    readonly "#context": Container<any>;
    readonly "#state": "INITIALIZING" | "READY" | "DISPOSING" | "DISPOSED";
    readonly "#ready": boolean;
    readonly "#initComplete": Promise<void>;
    readonly "#disposeComplete": Promise<void>;
}
```

Metadata added to every store instance. See [Store Metadata](/mom/api-reference/store-metadata) for details.

## `storeIId`

```typescript
function storeIId<D extends StoreDef<any, any>>(ns: string): AsyncIID<StoreFactory<D>>;
```

Creates an asimo `AsyncIID` token for a store factory. Wrapper around `asyncIID`:

```typescript
export const CounterIID = storeIId<CounterDef>("myapp.counter");
```

## `asyncIID`

```typescript
const asyncIID: typeof _asyncIID;
```

Re-exported from `@asimojs/asimo` for convenience. Creates async interface identifiers for non-store services:

```typescript
import { asyncIID } from "@asimojs/mom";

export const TimeServiceIID = asyncIID<TimeService>()("myapp.services.TimeService");
```

## `IoCContainer`

```typescript
type IoCContainer = Container<any>;
```

Backward-compatible alias for the asimo `Container` type.
