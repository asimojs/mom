---
title: Reactivity
description: MobX reactivity fundamentals — computed properties, observer, autorun, and reaction
---

Mom is a thin layer on top of MobX and React. Understanding MobX reactivity is essential to using mom effectively.

## How MobX reactivity works

Reactive programming propagates data changes automatically. MobX achieves this with two mechanisms:

1. **Observable data** — objects wrapped with `makeAutoObservable` (used internally by `initModel` and `initState`) become [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) objects where every read and write is tracked
2. **Reactive functions** — functions wrapped by MobX processors (`computed`, `autorun`, `reaction`, `observer`) that automatically subscribe to the observables they read and re-run when those values change

MobX detects dependencies dynamically at runtime — no explicit subscription declarations needed. If a reactive function reads `model.value`, MobX subscribes to changes on that specific property. Different code paths (e.g. inside `if` blocks) produce different dependency sets.

## Computed properties

Computed properties are derived values that update automatically:

```typescript
const model = store.initModel({
    value: 0,
    get formattedValue() {
        return String(model.value).padStart(2, "0");
    },
});
```

![MobX Reactivity](/mom/images/mobx-reactivity-flow.svg)

MobX caches computed values and only recalculates when dependencies change. Computed properties can chain — a computed reading another computed creates a reaction chain.

## React observers

The primary use of reactivity in mom is **automatic view updates**. MobX's `observer()` wraps a React component so it re-renders when any observable it reads changes:

```tsx
export const CounterView = observer(({ store }: ViewProps<CounterStore>) => (
    <div>
        <div>Counter: {store.formattedValue}</div>
        <button onClick={() => store.increment(1)}>Increment</button>
        <button onClick={() => store.reset()}>Reset</button>
    </div>
));
```

This component re-renders when `store.formattedValue` changes, but **not** when other properties change (e.g. `store["#ready"]`). Parent components are also unaffected — only components that read changed observables re-render. This fine-grained reactivity is what makes MobX performant in large component trees.

## `store.autorun()`

For effects inside the store (not in a view), use `store.autorun()`:

```typescript
store.autorun(() => {
    console.log("Value changed:", model.value);
});
```

Like `observer`, it tracks which observables the function reads and re-runs when they change. Mom's wrapper automatically disposes the autorun when the store is disposed — no manual cleanup needed.

A common use case is implementing `onChange` callbacks:

```typescript
store.autorun(() => {
    params.onChange?.(model.value);
});
```

## `store.reaction()`

For finer-grained control, `store.reaction()` takes two functions:

1. **Data function** — reads observables and returns a value (defines the dependencies)
2. **Effect function** — receives the value and performs side effects (writes)

```typescript
store.reaction(
    // Data: what to track
    () => ({ login: model.login.value, password: model.password.value }),
    // Effect: what to do when it changes
    (data) => {
        model.loginAction.setDisabled(data.login === "" || data.password === "");
    },
);
```

This separation prevents accidental dependency loops: the effect function's reads don't create subscriptions.

:::caution
Avoid dependency loops in reactions — if A computes from B which computes from C which computes from A. A safe pattern is to order reactions so each one only reads values defined before it and writes values that appear after.
:::

## Mom's reaction defaults

Mom enhances MobX's autorun and reaction with sensible defaults:

- **Auto-naming** — each reaction gets a name based on the store `#id` (e.g. `myapp.counter#5:autorun:1`)
- **Error logging** — errors in reactions are automatically reported with the store id
- **`fireImmediately: true`** — `store.reaction()` fires immediately by default (unlike plain MobX), so it behaves consistently with `autorun` and computed properties
- **Auto-disposal** — all reactions are disposed when the store is disposed

## `runInAction`

One MobX rule to remember: observable mutations after an `await` must be wrapped in `runInAction()`:

```typescript
store.onInit(async () => {
    const data = await fetchData();
    runInAction(() => {
        model.items = data;  // must be inside runInAction after await
    });
});
```

Synchronous methods created by `initModel` are already actions — `runInAction` is only needed for code running outside an action context (typically after `await`).

## Next

[Dependency Inversion →](/mom/core-concepts/dependency-inversion)
