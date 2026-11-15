---
title: Why Stores?
description: The MVVM pattern and how mom applies it to React
---

## The problem

React components naturally accumulate state, effects, callbacks, and business logic alongside their JSX rendering. In small apps this works fine. In large codebases maintained by multiple developers, it becomes a problem:

- **Readability** — components mix UI mapping with business rules, making them hard to scan
- **Testability** — logic buried inside hooks requires React Testing Library and DOM emulation to test
- **Reusability** — the same logic can't power different UIs (e.g. a desktop layout and a mobile layout)
- **Refactoring** — splitting a component means untangling its state and hooks too

The solution is to **extract all state and logic into dedicated objects** — stores — and leave React components as thin mapping layers.

![From mixed components to stores](/mom/images/mvvm-store-split.svg)

## The MVVM pattern

Mom implements the **Model-View-ViewModel** (MVVM) pattern:

- **Model** — the observable data exposed by the store (`initModel`)
- **ViewModel** — the store itself: observable data, computed values, actions, and lifecycle — all in one object
- **View** — React components wrapped with `observer()` that reactively bind to the ViewModel

![MVVM pattern in mom](/mom/images/mvvm-pattern.svg)

In mom, the store *is* the ViewModel. It exposes observable data and actions as a single cohesive object. The View reads data from the store and forwards user events to its actions — classic MVVM data binding. There is no separate controller layer.

### Unidirectional data flow

Changes flow in one direction:

![Data flow](/mom/images/mvvm-data-flow.svg)

The user interacts with the View, which calls an action on the store. The action mutates the model. MobX detects the change and automatically re-renders the views that read the affected data. Views never mutate the model directly — they only read it.

## How it maps to code

| MVVM layer | Mom equivalent | Example |
|------------|---------------|---------|
| **Model** | The object passed to `store.initModel()` | `{ value: 0, increment() { ... } }` |
| **ViewModel** | The store instance (Model + metadata) | `Store<CounterDef>` |
| **View** | React component wrapped with `observer()` | `CounterView` |

The View reads from the ViewModel and forwards user events to its actions:

```tsx
export const CounterView = observer(({ store }: ViewProps<CounterStore>) => (
    <div>
        <span>{store.formattedValue}</span>              {/* read data */}
        <button onClick={() => store.increment()}>+</button>  {/* call action */}
    </div>
));
```

> **Coming from MVC/HMVC?** The classical MVC pattern separates Model, View, and Controller into three distinct layers. Mom's stores combine the Model and Controller roles into a single ViewModel — the defining characteristic of MVVM. If you've used MVC stores before, the mental model is very similar; the terminology is just more precise.

## Benefits

### Simpler, more readable components

React components contain only JSX mapping — no `useState`, no `useEffect`, no business logic. Most components receive just a `store` prop and an optional `className`. They become trivial to read and review.

### Testability without the DOM

All logic lives in plain TypeScript stores. You test with vitest or jest directly — no DOM emulation, no `render()`, no `fireEvent`. Tests are fast, deterministic, and cover the code that actually matters.

### Reusable models, swappable views

The same store can power entirely different React components: a full desktop layout and a compact mobile view, an editing form and a read-only summary. Change the view without touching the logic.

### Better composability

Stores compose hierarchically — parent stores mount children, coordinate them through their models, and react to their changes. A form store can mount input field stores and coordinate validation across them. This kind of cross-component coordination is difficult with React state alone.

### Progressive application loading

Stores load on demand via the IoC container. Only the code needed for the current view ships to the browser — additional store code is fetched when first requested.

### Maintainability at scale

Prescriptive conventions (one folder per store, standardized file names, clear type patterns) make large codebases navigable. New developers — and AI tools — know exactly where to find and where to write specific code.

### Easier refactoring

Since state and logic are separate from rendering, you can split, merge, or replace React components without touching business logic, and vice versa.

The trade-off is slightly more boilerplate compared to inline hooks, but the structure pays for itself as the codebase grows.

## Next

[Store Basics →](/mom/core-concepts/store-basics)
