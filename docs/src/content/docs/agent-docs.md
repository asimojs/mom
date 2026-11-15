---
title: Agent Documentation
description: LLM/AI agent guidance for working with mom codebases
---

This page provides structured guidance for AI coding assistants working with mom-based projects.

## What is mom?

Mom is an ultra-thin TypeScript library on top of React and MobX implementing micro-stores organized according to the Hierarchical Model-View-ViewModel (HMVVM) pattern. It uses `@asimojs/asimo` for dependency injection.

Package: `@asimojs/mom`

## Core architecture

A **Store** is a MobX-observable state object (ViewModel) exposed as read-only, with lifecycle management and hierarchical parent-child relationships. Stores are created via factories defined with `defineStore()`.

The lifecycle is: `INITIALIZING → READY → DISPOSING → DISPOSED`

### Key APIs

All exported from `@asimojs/mom`:

- `defineStore(iid, factoryFn)` — define a store factory
- `createStore(factory, params)` — instantiate a root store
- `disposeStore(store)` — dispose a root store
- `registerRootService(factory)` — register a service on the root DI container
- `rootContext` — the root IoC container

### StoreContext API (inside factory functions)

- `initModel(model)` — create the observable model (public data + actions)
- `initState(state)` — create private observable state
- `onInit(fn)` / `onDispose(fn)` — lifecycle hooks
- `mount(factory, params)` / `unmount(store)` — manage child stores
- `autorun()` / `reaction()` — MobX reactions auto-disposed with the store
- `createChildContext(services)` — create a child IoC container
- `context` — asimo IoC container for fetching services
- `store` — reference to current store instance (available after initModel)

## File conventions

### Store modules

```
featureName/
├── store.types.ts     # Public API types + IID
├── store.ts           # Implementation (factory)
├── store.view.tsx     # React component(s)
├── store.spec.ts      # Tests
└── store.example.tsx  # Usage example (optional)
```

### Services

```
serviceName/
├── service.types.ts     # Interface + IID + fake controller type
├── service.ts           # Implementation
├── service.mock.ts      # Fake for testing
└── service.mock.spec.ts # Mock tests
```

## Naming conventions

| Pattern | Example | Purpose |
|---------|---------|---------|
| `XxxDef` | `CounterDef` | Store definition type |
| `XxxStore` | `CounterStore` | Public store type: `Store<XxxDef>` |
| `XxxIID` | `CounterIID` | Store interface identifier |
| PascalCase | `Counter` | Factory constant |
| `#`-prefix | `#id`, `#ready` | Store metadata properties |

## Store pattern template

```typescript
// store.types.ts
import { Store, storeIId } from "@asimojs/mom";

type MyFeatureDef = {
    params: {
        initialValue?: string;
    };
    model: {
        value: string;
        setValue(v: string): void;
    };
};

export type MyFeatureStore = Store<MyFeatureDef>;
export const MyFeatureIID = storeIId<MyFeatureDef>("myapp.myFeature");
```

```typescript
// store.ts
import { defineStore } from "@asimojs/mom";
import { MyFeatureIID } from "./store.types";

export const MyFeature = defineStore(MyFeatureIID, (store, params) => {
    const model = store.initModel({
        value: params.initialValue ?? "",
        setValue(v: string) { model.value = v; },
    });

    store.onInit(async () => { /* async setup */ });
    store.onDispose(() => { /* cleanup */ });
});
```

```tsx
// store.view.tsx
import { observer } from "mobx-react-lite";
import { ViewProps } from "@asimojs/mom";
import { MyFeatureStore } from "./store.types";

export const MyFeatureView = observer(({ store }: ViewProps<MyFeatureStore>) => (
    <div>{store.value}</div>
));
```

## Testing pattern

```typescript
import { createContainer, Container } from "@asimojs/asimo";
import { createStore, disposeStore, rootContext } from "@asimojs/mom";

describe("MyFeature", () => {
    let store: MyFeatureStore;

    afterEach(() => { store && disposeStore(store); });

    async function init(params = {}) {
        store = createStore(MyFeature, params);
        await store["#initComplete"];
    }

    it("should work", async () => {
        await init({ initialValue: "hello" });
        expect(store.value).toBe("hello");
    });
});
```

## Important rules

1. **Types in separate files** — parent stores import only types/IIDs from children, never implementations
2. **`initModel` called once** — must be called exactly once per store factory
3. **`runInAction` after await** — any observable mutation after `await` needs `runInAction()`
4. **`store.mount` for children** — never use `createStore` for child stores
5. **`observer` on views** — all React components reading store data must be wrapped
6. **Reactions after initModel** — `autorun` and `reaction` must be called after `initModel`

## Dependencies

- Runtime: `@asimojs/asimo` (DI/IoC)
- Peer: `mobx`, `react`, `mobx-react-lite`
