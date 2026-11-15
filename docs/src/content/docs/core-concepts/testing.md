---
title: Testing
description: Testing stores with Dependency Inversion — fake services, no DOM required
---

One of mom's key benefits is that **all store logic can be tested with plain unit tests** — no DOM, no React rendering, no browser emulation.

## The testing pattern

Mom tests follow a consistent structure:

1. Create fake service implementations
2. Build a test IoC container extending `rootContext` with those fakes
3. Instantiate the store with the test context
4. Exercise the store and assert on its model

```typescript
import { createContainer, Container } from "@asimojs/asimo";
import { createStore, disposeStore, rootContext } from "@asimojs/mom";
import { CountDown } from "./store";
import { CountDownStore, CountDownDef } from "./store.types";
import { createFakeTimeService, FakeTimeServiceController } from "@asimojs/mom/services";

describe("CountDown", () => {
    let context: Container<any>;
    let store: CountDownStore;
    let timeController: FakeTimeServiceController;

    beforeEach(() => {
        timeController = createFakeTimeService();
        context = createContainer({
            extends: [rootContext],
            name: "test:CountDown",
            services: [timeController.factory],
        });
    });

    afterEach(() => {
        store && disposeStore(store);
    });

    async function init(params?: CountDownDef["params"]) {
        store = createStore(CountDown, { context, ...params });
        await store["#initComplete"];
    }
});
```

### The `init()` helper

A common pattern is to define a local `init()` function that creates the store and optionally waits for initialization. This keeps individual tests concise:

```typescript
async function init(params?: CountDownDef["params"], awaitInit = true) {
    store = createStore(CountDown, { context, ...params });
    if (awaitInit) {
        await store["#initComplete"];
    }
}
```

## Testing with fake services

Fake service implementations provide two interfaces:

- **The public interface** — same API as the real service, registered via the IID
- **A controller interface** — lets tests drive external events and inspect internal state

### Example: FakeTimeService

The `FakeTimeServiceController` lets you control time in tests:

```typescript
it("should support default values", async () => {
    await init({}, false);
    expect(store["#ready"]).toBe(false);  // async init not complete

    await store["#initComplete"];
    expect(store["#ready"]).toBe(true);

    // autoStart defaults to false — counter shouldn't change
    timeController.moveTime(2000);
    expect(store.value).toBe(10);

    // Start and verify the interval
    store.start();
    timeController.moveTime(999);
    expect(store.value).toBe(10);  // not yet

    timeController.moveTime(1);
    expect(store.value).toBe(9);   // ticked!
});
```

```typescript
it("should support start / stop", async () => {
    await init({ intervalMs: 5 });
    expect(store.value).toBe(10);
    expect(store.isRunning).toBe(false);

    store.start();
    expect(store.isRunning).toBe(true);
    timeController.moveTime(7);
    expect(store.value).toBe(9);

    store.stop();
    timeController.moveTime(100);
    expect(store.value).toBe(9);  // unchanged

    store.start();
    timeController.moveTime(7);
    expect(store.value).toBe(8);
});
```

The fake time service:
- Lets you advance time precisely with `moveTime(ms)`
- Triggers pending interval/timeout callbacks synchronously
- Exposes `numberOfActiveIntervals` and `numberOfActiveTimeouts` for assertions
- Has a `reset()` method for reuse across tests

## Testing lifecycle

You can verify lifecycle behavior by not awaiting init:

```typescript
it("should start in INITIALIZING state", async () => {
    await init({}, false);  // don't await init
    expect(store["#state"]).toBe("INITIALIZING");
    expect(store["#ready"]).toBe(false);

    await store["#initComplete"];
    expect(store["#state"]).toBe("READY");
    expect(store["#ready"]).toBe(true);
});
```

## Testing without DI

Stores that don't use external services can be tested without a custom context:

```typescript
it("should increment", async () => {
    const store = createStore(Counter, { value: 5 });
    await store["#initComplete"];

    expect(store.value).toBe(5);
    store.increment();
    expect(store.value).toBe(6);

    disposeStore(store);
});
```

## Key takeaways

- **No DOM needed** — test store logic directly with vitest/jest
- **Fake services** provide controllable replacements for browser APIs
- **Test containers** extend `rootContext` to inherit defaults while overriding specific services
- **`#initComplete`** and `#ready` help test async initialization
- Tests are fast, deterministic, and easy to maintain

## Next

Explore the [Guides](/mom/guides/forms) for practical patterns, or see the full [API Reference](/mom/api-reference/definestore).
