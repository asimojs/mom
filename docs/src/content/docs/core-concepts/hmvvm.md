---
title: The HMVVM Pattern
description: Hierarchical Model-View-ViewModel — organizing stores as a tree
---

## From MVVM to HMVVM

A single store works well for small features. In real applications, stores grow large and need to be split into smaller, focused units organized as a hierarchy — this is **Hierarchical MVVM** (HMVVM).

HMVVM extends the MVVM pattern by organizing ViewModels into a tree (or [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph)), where parent ViewModels coordinate their children.

## Why connect through models, not views?

Most approaches to building hierarchical UIs — including idiomatic React — connect components through the **view layer**. A parent component renders child components, passing data down via props and receiving events back via callbacks. This works for simple cases, but it creates a fundamental limitation: **parent models have no direct access to child models**. All coordination must go through the view, leading to prop drilling, callback chains, and business logic scattered across components.

Mom takes a different approach: stores are connected through their **models**. A parent store mounts child stores and exposes them as observable properties on its own model, building a coherent application state tree:

![HMVVM module hierarchy](/mom/images/hmvvm-hierarchy.svg)

Because stores are connected at the model level, you can traverse the entire application state by navigating the model tree — parent stores can directly read, call actions on, and react to changes in their children. No prop drilling, no callbacks, no intermediate view layer.

In practice, **most child store references are nullable** (and null by default) because they are loaded on demand — only the stores needed for the current view are instantiated. Equally important, stores must be **unloaded when no longer needed** to keep memory consumption under control. This dynamic mount/unmount cycle means the application only holds the state that is actively in use.

## Module granularity

How small should a store be? After years of practice, mom is designed with the conviction that **very small stores are fine** as long as they're part of a larger store hierarchy.

Examples:

- **One store per input field** — as a child of a form store. Validation and behavior logic live in the input store; coordination logic (e.g. "disable submit when fields are empty") lives in the parent form store.
- **Average-complexity stores** — managing several state values and a handful of child stores.

The key insight: **parent stores can coordinate child stores through their models**. A parent can call actions on child stores, read their observable values, and react to their changes. This is something that's difficult to achieve with React component state alone and is one of the main strengths of the HMVVM approach.

## Example: form with input fields

```typescript
// loginForm/store.ts
export const LoginForm = defineStore((store) => {
    const model = store.initModel({
        login: store.mount(TextInput, { mandatory: true }),
        password: store.mount(TextInput, { mandatory: true, password: true }),
        loginAction: store.mount(Action, { text: "Login", disabled: true }),
    });

    // Parent coordinates children: disable login when fields are empty
    store.autorun(() => {
        model.loginAction.setDisabled(
            model.login.value === "" || model.password.value === ""
        );
    });
});
```

Here the `LoginForm` parent store mounts three child stores (`TextInput`, `TextInput`, `Action`) and uses `autorun` to coordinate them. The children don't know about each other — only the parent manages the cross-store logic.

## Relationship to MVC/HMVC

If you're familiar with MVC/HMVC terminology:

| MVC/HMVC | MVVM/HMVVM (mom) |
|----------|------------------|
| Model + Controller | ViewModel (store) |
| View | View (React + observer) |
| Controller logic | Methods on the store model |
| Hierarchical MVC | Hierarchical MVVM — same tree organization |

The key difference is that in MVC the Controller is separate from the Model, while in MVVM the ViewModel combines both into a single cohesive object. Mom's stores are ViewModels.

## Next

[Child Stores: Mount & Unmount →](/mom/core-concepts/child-stores)
