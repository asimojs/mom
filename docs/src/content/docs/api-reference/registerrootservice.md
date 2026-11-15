---
title: registerRootService
description: Register a service factory on the root IoC container
---

Registers a service factory on mom's root application context, making it globally available to all stores.

## Signature

```typescript
function registerRootService(serviceFactory: ServiceFactory<any, any>): void;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `serviceFactory` | `ServiceFactory` | An asimo factory created with `factory()` |

## Example

```typescript
import { registerRootService } from "@asimojs/mom";
import { factory } from "@asimojs/asimo";
import { TimeServiceIID } from "./services/timeService/service.types";
import { BrowserTimeService } from "./services/timeService/service";

registerRootService(factory({
    provide: [TimeServiceIID],
    load: async () => new BrowserTimeService(),
}));
```

## Behavior

- Adds the factory to the root service registry, keyed by each IID's namespace
- Rebuilds the internal root container so the new service is immediately available
- The stable [`rootContext`](/mom/api-reference/rootcontext) proxy automatically reflects the change — existing child containers that extend `rootContext` can resolve the new service

## Automatic registration

When you call `defineStore` with an IID:

```typescript
export const Counter = defineStore(CounterIID, (store, params) => { /* ... */ });
```

Mom automatically calls `registerRootService` to register the store factory. This means any store or service can resolve `CounterIID` through the IoC system without explicit registration.

## Notes

- If a factory for the same IID namespace is already registered, it will be replaced
- This is typically called at module load time (top-level), not inside store factories
- For test overrides, create a child container with `createContainer` instead of calling `registerRootService`
