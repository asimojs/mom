---
title: StoreContext
description: The context object passed to store factory functions
---

`StoreContext<D>` is the first argument of the factory function passed to `defineStore`. It provides all the APIs needed to set up a store.

## Properties

### `context`

```typescript
context: Container<any>
```

The IoC container associated with this store. Defaults to the parent store's context (or `rootContext` for root stores). Use it to fetch dependencies.

### `store`

```typescript
store: Store<D> | null
```

Reference to the current store instance. Only available **after** `initModel()` is called — returns `null` before that.

## Methods

### `initModel`

```typescript
initModel(initialModel: D["model"]): D["model"]
```

Creates the MobX observable model for this store. Wraps the object with `makeAutoObservable`. Must be called exactly **once** per store.

Returns the observable model (same reference as the input, now proxied by MobX).

```typescript
const model = store.initModel({
    value: 0,
    get computed() { return model.value * 2; },
    increment() { model.value++; },
});
```

### `initState`

```typescript
initState<S extends object>(state: S): S
```

Creates private observable state not exposed on the store's public model. Wraps with `makeAutoObservable`. Can be called at most **once** per store.

```typescript
const state = store.initState({
    intervalId: 0,
    loadCompleted: false,
});
```

### `onInit`

```typescript
onInit(fn: () => void | Promise<void>): void
```

Registers a callback called immediately after the store factory returns. Can be sync or async. Must be called at most **once**.

When async, the store stays in `INITIALIZING` state until the promise resolves.

```typescript
store.onInit(async () => {
    const data = await fetchData();
    runInAction(() => { model.items = data; });
});
```

### `onDispose`

```typescript
onDispose(fn: () => void | Promise<void>): void
```

Registers a callback called when the store is disposed/unmounted. Can be sync or async. Must be called at most **once**.

```typescript
store.onDispose(() => {
    model.stop();  // clean up resources
});
```

### `mount`

```typescript
mount<SD>(storeFactory: StoreFactory<SD>, params?: SD["params"]): Store<SD>
```

Creates a child store attached to this store. The child inherits this store's context and will be automatically disposed when the parent is disposed.

```typescript
const child = store.mount(Counter, { value: 10 });
```

### `unmount`

```typescript
unmount(store: Store<any> | null): null
```

Disposes a child store and returns `null`. Convenient for clearing the reference in one line:

```typescript
model.child = store.unmount(model.child);
```

### `terminate`

```typescript
terminate(): void
```

Triggers the store's own disposal. Equivalent to the parent calling `unmount` on this store.

### `createChildContext`

```typescript
createChildContext(services?: ServiceFactory<any, any>[]): void
```

Creates a new child IoC container extending the current `store.context`, and replaces `store.context` with it. Child stores mounted after this call will inherit the new context.

```typescript
store.createChildContext([
    factory({ provide: [ConfigSIID], load: () => ({ debug: true }) }),
]);
```

### `autorun`

```typescript
autorun(
    effect: (r: IReactionPublic) => any,
    options?: IAutorunOptions
): IReactionDisposer
```

Wrapper over MobX's `autorun` that auto-disposes with the store. Sets default `name` (based on store `#id`) and `onError` options.

Must be called **after** `initModel()`.

```typescript
store.autorun(() => {
    params.onChange?.(model.value);
});
```

### `reaction`

```typescript
reaction<T>(
    expression: (r: IReactionPublic) => T,
    effect: (arg: T, prev: T | undefined, r: IReactionPublic) => void,
    options?: IReactionOptions<T>
): IReactionDisposer
```

Wrapper over MobX's `reaction` that auto-disposes with the store. Defaults to `fireImmediately: true` (unlike plain MobX). The effect function is automatically wrapped in `runInAction`.

Must be called **after** `initModel()`.

```typescript
store.reaction(
    () => model.value,
    (value) => { model.message = `Value is ${value}`; },
);
```
