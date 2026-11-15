---
title: rootContext
description: The root IoC container
---

The stable root asimo container that serves as the default context for all root stores.

## Signature

```typescript
const rootContext: Container<any>;
```

## Description

`rootContext` is a stable proxy object (named `"asm"`) that wraps an internal container. When services are added via `registerRootService`, the internal container is rebuilt, but the `rootContext` reference stays the same. This means child containers created with `extends: [rootContext]` automatically see newly registered services.

## Usage

### Default store context

All root stores created with `createStore` use `rootContext` as their default IoC context:

```typescript
const store = createStore(Counter);
// The store uses rootContext (or a descendant) as its IoC context
```

### Extending for tests

Create child containers for test isolation:

```typescript
import { createContainer } from "@asimojs/asimo";
import { rootContext } from "@asimojs/mom";

const testContext = createContainer({
    name: "test",
    extends: [rootContext],
    services: [fakeTimeController.factory],
});

const store = createStore(CountDown, { context: testContext });
```

### Fetching services directly

```typescript
import { rootContext } from "@asimojs/mom";

const timeService = await rootContext.fetch(TimeServiceIID);
```

## Behavior

- Named `"asm"` internally (stable root)
- Rebuilt whenever `registerRootService` is called
- Child containers extending it inherit all registered services
- Default context for root stores unless overridden via the `context` param
- The proxy ensures method calls are always forwarded to the current internal container

## Notes

- Do not modify `rootContext` directly — use `registerRootService` to add services
- For test-specific overrides, always use `createContainer({ extends: [rootContext] })` rather than modifying the root
