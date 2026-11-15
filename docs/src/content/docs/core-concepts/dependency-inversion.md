---
title: Dependency Inversion
description: IoC containers, async/sync dependencies, and asimo integration
---

## The principle

**Dependency Inversion** (also known as Inversion of Control / IoC) means: *code should rely on interfaces, not implementations*. This enables:

- **Testability** — swap real services for fakes in tests
- **Progressive loading** — load service implementations on demand
- **Flexibility** — change implementations without modifying consuming code

Mom integrates the [asimo](https://asimojs.github.io/asimo/) library for IoC. Instead of injecting dependencies at construction time (which requires eager loading), asimo lets stores **fetch** dependencies on demand — crucial for client-side code splitting.

## IoC containers (contexts)

Asimo containers are hierarchical dictionaries that map interface identifiers (IIDs) to implementations:

![DI Context Hierarchy](/mom/images/di-context-hierarchy.svg)

Containers form a tree. When you fetch a dependency, asimo searches up the chain until it finds a match:

```typescript
import { createContainer } from "@asimojs/asimo";
import { rootContext } from "@asimojs/mom";

const c1 = createContainer({ name: "c1", extends: [rootContext] });
const c2 = createContainer({ name: "c2", extends: [c1] });
const c3 = createContainer({ name: "c3", extends: [c1] });
```

- `c2.fetch(LocalStorageIID)` → returns the implementation registered on c2 (or searches up to c1, then rootContext)
- `c3.fetch(LocalStorageIID)` → searches c3, then c1, then rootContext

If a dependency isn't found:
- `context.fetch(SomeIID)` — throws an error (missing dependency = misconfiguration)
- `context.fetchOptional(SomeIID)` — returns `null` (TypeScript reflects the nullable type)

## Synchronous vs asynchronous dependencies

Asimo supports two types of interface identifiers:

| Type | Created with | Retrieved with | Use case |
|------|-------------|---------------|----------|
| **AsyncIID** | `asyncIID<T>()("namespace")` | `await context.fetch(iid)` | Services, store factories — loaded on demand |
| **SyncIID** | `syncIID<T>()("namespace")` | `context.get(iid)` | Configuration objects — available immediately |

Mom's `storeIId()` is a wrapper around `asyncIID`.

## Using dependencies in stores

Every store has a `store.context` property pointing to its IoC container. Use it to fetch dependencies:

```typescript
export const CountDown = defineStore(CountDownIID, (store, params) => {
    let timeService: TimeService | null = null;

    const model = store.initModel({
        value: params.initValue ?? 10,
        start() {
            if (!timeService) return;
            // Use the injected service instead of window.setInterval
            state.intervalId = timeService.setInterval(() => {
                runInAction(() => { model.value--; });
            }, params.intervalMs ?? 1000);
        },
        stop() {
            timeService?.clearInterval(state.intervalId);
            state.intervalId = 0;
        },
        // ...
    });

    const state = store.initState({ intervalId: 0 });

    store.onInit(async () => {
        timeService = await store.context.fetch(TimeServiceIID);
        params.autoStart && model.start();
    });

    store.onDispose(() => {
        model.stop();
    });
});
```

The store only imports the `TimeService` **interface** and IID — not the implementation. The actual implementation is resolved at runtime through the container.

## Registering dependencies

Dependencies are declared as asimo factories:

```typescript
import { factory } from "@asimojs/asimo";

const calculatorFactory = factory({
    provide: [CalculatorIID],
    load: async () => new CalculatorService(),
});

const c1 = createContainer({
    name: "c1",
    extends: [rootContext],
    services: [calculatorFactory],
});
```

For synchronous dependencies, use a synchronous `load` function.

## `registerRootService`

For default services that should be globally available, use `registerRootService`:

```typescript
import { registerRootService } from "@asimojs/mom";
import { factory } from "@asimojs/asimo";

registerRootService(factory({
    provide: [TimeServiceIID],
    load: async () => new BrowserTimeService(),
}));
```

When you create a store factory with an IID (`defineStore(MyIID, fn)`), the factory is automatically registered on `rootContext` — this is how stores can be loaded through the IoC system.

## Context inheritance

By default, child stores inherit their parent's context. You can override this:

**For root stores** — pass a custom context to `createStore`:

```typescript
const testContext = createContainer({ name: "test", extends: [rootContext] });
const store = createStore(CountDown, { intervalMs: 500, context: testContext });
```

**For child stores** — use `store.createChildContext()` inside the parent:

```typescript
store.createChildContext([
    factory({
        provide: [ConfigSIID],
        load: () => ({ maxSize: 10 }),
    }),
]);
// store.context now points to the new child container
```

## Next

[Testing →](/mom/core-concepts/testing)
