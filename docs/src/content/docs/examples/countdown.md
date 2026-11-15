---
title: Countdown Timer
description: Async dependencies — TimeService via IoC, interval management, lifecycle cleanup
---

A countdown timer demonstrating **async initialization**, **Dependency Inversion**, and **lifecycle cleanup**.

## Features used

- `onInit` (async) and `onDispose` for lifecycle management
- `initState` for private state (`intervalId`)
- Dependency Inversion with `TimeServiceIID`
- Computed getter (`isRunning`)
- `runInAction` inside interval callbacks

## Types

```typescript
// countdown/store.types.ts
import { Store, storeIId } from "@asimojs/mom";

type CountDownDef = {
    params: {
        /** Initial countdown value - default: 10 */
        initValue?: number;
        /** Interval in ms - default: 1000 */
        intervalMs?: number;
        /** Auto-start on init */
        autoStart?: boolean;
    };
    model: {
        value: number;
        isRunning: boolean;
        start(): void;
        stop(): void;
        reset(): void;
    };
};

export type CountDownStore = Store<CountDownDef>;
export const CountDownIID = storeIId<CountDownDef>("mom.examples.countdown");
```

## Store

```typescript
// countdown/store.ts
import { defineStore } from "@asimojs/mom";
import { runInAction } from "mobx";
import { CountDownIID } from "./store.types";
import { TimeService, TimeServiceIID } from "@asimojs/mom/services";

export const CountDown = defineStore(CountDownIID, (store, params) => {
    const { initValue = 10, intervalMs = 1000, autoStart = false } = params;
    let timeService: TimeService | null = null;

    const model = store.initModel({
        value: initValue,
        get isRunning() {
            return state.intervalId > 0;
        },

        start() {
            if (state.intervalId || !timeService) return;
            state.intervalId = timeService.setInterval(() => {
                runInAction(() => {
                    if (model.value > 0) model.value--;
                    if (model.value === 0) model.stop();
                });
            }, intervalMs);
        },

        stop() {
            if (!timeService) return;
            timeService.clearInterval(state.intervalId);
            state.intervalId = 0;
        },

        reset() {
            model.value = initValue;
        },
    });

    const state = store.initState({
        intervalId: 0,
    });

    store.onInit(async () => {
        timeService = await store.context.fetch(TimeServiceIID);
        autoStart && model.start();
    });

    store.onDispose(() => {
        model.stop();
    });
});
```

### Key patterns

- **Async `onInit`** — the store fetches `TimeService` asynchronously. The store is in `INITIALIZING` state until this completes
- **`initState`** — `intervalId` is private; views can't see it but `isRunning` computed derives from it
- **Dependency Inversion** — uses `TimeServiceIID` interface, not `window.setInterval` directly. This enables precise testing
- **`onDispose` cleanup** — stops the interval to prevent memory leaks
- **`runInAction`** — required inside the `setInterval` callback because it runs outside MobX action context

## View

```tsx
// countdown/store.view.tsx
import { observer } from "mobx-react-lite";
import { ViewProps } from "@asimojs/mom";
import { CountDownStore } from "./store.types";

export const CountDownView = observer(({ store }: ViewProps<CountDownStore>) => {
    if (!store["#ready"]) return <div>Loading...</div>;

    return (
        <div>
            <div>Countdown: {store.value}</div>
            <button onClick={() => store.start()} disabled={store.isRunning}>Start</button>
            <button onClick={() => store.stop()} disabled={!store.isRunning}>Stop</button>
            <button onClick={() => store.reset()}>Reset</button>
        </div>
    );
});
```

Note the `#ready` check — since `onInit` is async, the store may not be ready during the first render.

## Test

```typescript
// countdown/store.spec.ts
import { createContainer, Container } from "@asimojs/asimo";
import { createStore, disposeStore, rootContext } from "@asimojs/mom";
import { CountDown } from "./store";
import { createFakeTimeService, FakeTimeServiceController } from "@asimojs/mom/services";

describe("CountDown", () => {
    let context: Container<any>, store, timeController: FakeTimeServiceController;

    beforeEach(() => {
        timeController = createFakeTimeService();
        context = createContainer({
            extends: [rootContext],
            name: "test:CountDown",
            services: [timeController.factory],
        });
    });

    afterEach(() => { store && disposeStore(store); });

    async function init(params = {}) {
        store = createStore(CountDown, { context, ...params });
        await store["#initComplete"];
    }

    it("should countdown with fake time", async () => {
        await init({ initValue: 3, intervalMs: 100, autoStart: true });

        expect(store.value).toBe(3);
        expect(store.isRunning).toBe(true);

        timeController.moveTime(100);
        expect(store.value).toBe(2);

        timeController.moveTime(100);
        expect(store.value).toBe(1);

        timeController.moveTime(100);
        expect(store.value).toBe(0);
        expect(store.isRunning).toBe(false);  // auto-stopped at 0
    });

    it("should clean up on dispose", async () => {
        await init({ autoStart: true });
        expect(timeController.numberOfActiveIntervals).toBe(1);

        disposeStore(store);
        expect(timeController.numberOfActiveIntervals).toBe(0);
    });
});
```

The fake `TimeService` makes tests **deterministic** and **instant** — no real timers, no flaky delays.
