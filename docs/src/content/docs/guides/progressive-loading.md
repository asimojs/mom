---
title: Progressive Loading
description: Lazy store code loading via IID and asimo
---

In large applications, loading all store code upfront defeats the purpose of code splitting. Mom's integration with asimo enables **progressive loading** — store implementations are loaded on demand, only when needed.

## How it works

When you define a store with an IID:

```typescript
export const Counter = defineStore(CounterIID, (store, params) => { /* ... */ });
```

Mom automatically registers the store factory on `rootContext`. Any store (or service) can then resolve `CounterIID` through the IoC container to get the factory.

The key principle: **parent stores should only import child store *types*, not implementations**. Type imports are erased at compile time, so they don't create runtime dependencies.

## Setting up lazy loading

### 1. Define types in a separate file

```typescript
// featureX/store.types.ts
import { Store, storeIId } from "@asimojs/mom";

type FeatureXDef = {
    params: { /* ... */ };
    model: { /* ... */ };
};

export type FeatureXStore = Store<FeatureXDef>;
export const FeatureXIID = storeIId<FeatureXDef>("myapp.featureX");
```

### 2. Register a lazy factory

Instead of directly importing the store implementation, register a factory that dynamically imports it:

```typescript
// featureX/index.ts (entry point)
import { registerRootService } from "@asimojs/mom";
import { factory } from "@asimojs/asimo";
import { FeatureXIID } from "./store.types";

registerRootService(factory({
    provide: [FeatureXIID],
    load: async () => {
        const { FeatureX } = await import("./store");
        return FeatureX;
    },
}));
```

### 3. Resolve in the parent

The parent store fetches the factory through the IoC container:

```typescript
// parentStore/store.ts
import { FeatureXIID, FeatureXStore } from "../featureX/store.types"; // type-only!

export const ParentStore = defineStore(ParentIID, (store) => {
    const model = store.initModel({
        featureX: null as FeatureXStore | null,

        async loadFeatureX() {
            if (model.featureX) return;
            const FeatureX = await store.context.fetch(FeatureXIID);
            runInAction(() => {
                model.featureX = store.mount(FeatureX, { /* params */ });
            });
        },
    });
});
```

The parent only imports `FeatureXIID` and `FeatureXStore` (types) — the actual implementation code is loaded only when `loadFeatureX()` is called.

## Why types must be separate

If the parent imported the child's `store.ts` directly:

```typescript
// BAD — creates a runtime dependency
import { FeatureX } from "../featureX/store";
```

The bundler would include `featureX/store.ts` in the parent's chunk, defeating code splitting.

With type-only imports:

```typescript
// GOOD — erased at compile time
import type { FeatureXStore } from "../featureX/store.types";
import { FeatureXIID } from "../featureX/store.types"; // IID is a runtime token but tiny
```

The IID token is a small runtime value (just a namespace string), while the type is erased.

## Bundle considerations

- Each store that uses `defineStore(IID, fn)` auto-registers on `rootContext`
- For stores loaded via dynamic `import()`, the registration happens when the module loads
- Vite and webpack handle `import()` as split points automatically
- The store definition file should be the dynamic import target

This pattern lets you build applications where only the stores needed for the current route/view are loaded, with additional stores fetched on demand as the user navigates.
