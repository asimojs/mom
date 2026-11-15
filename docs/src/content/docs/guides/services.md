---
title: Built-in Services
description: TimeService, StorageService, ClipboardService, and UrlParamsService
---

Mom ships with service interfaces and fake implementations for common browser APIs. Each service follows the same pattern: a public interface with an IID, a default browser implementation, and a fake implementation with a controller for testing.

## TimeService

Wraps `setInterval`, `clearInterval`, `setTimeout`, `clearTimeout`, and `Date.now()`.

```typescript
import { TimeServiceIID } from "@asimojs/mom/services";

store.onInit(async () => {
    const time = await store.context.fetch(TimeServiceIID);
    const id = time.setInterval(() => { /* tick */ }, 1000);
    // time.now gives current time in ms
});
```

### Fake for testing

```typescript
import { createFakeTimeService } from "@asimojs/mom/services";

const timeController = createFakeTimeService();
// Register on a test container
const context = createContainer({
    extends: [rootContext],
    services: [timeController.factory],
});

// In tests:
timeController.moveTime(5000);           // Advance 5 seconds, fire callbacks
timeController.executeNextCallback();    // Execute the next pending callback
timeController.numberOfActiveIntervals;  // Check active intervals
timeController.numberOfActiveTimeouts;   // Check active timeouts
timeController.reset();                  // Clean up
```

## StorageService

Wraps `localStorage` and `sessionStorage`.

```typescript
import { LocalStorageIID, SessionStorageIID } from "@asimojs/mom/services";

const storage = await store.context.fetch(LocalStorageIID);
storage.setItem("key", "value");
const value = storage.getItem("key");
storage.removeItem("key");
storage.clear();
```

### Fake for testing

```typescript
import { createFakeStorageService } from "@asimojs/mom/services";

const storageController = createFakeStorageService();
// Provides both LocalStorageIID and SessionStorageIID
const context = createContainer({
    extends: [rootContext],
    services: [storageController.factory],
});

// In tests:
storageController.reset();  // Clear all stored data
```

## ClipboardService

Wraps `navigator.clipboard.writeText()` and `readText()`.

```typescript
import { ClipboardServiceIID } from "@asimojs/mom/services";

const clipboard = await store.context.fetch(ClipboardServiceIID);
await clipboard.writeText("copied!");
const text = await clipboard.readText();
```

### Fake for testing

```typescript
import { createFakeClipboardService } from "@asimojs/mom/services";

const clipboardController = createFakeClipboardService();

// Can simulate errors:
clipboardController.throwErrorAfter(1);  // Next operation throws
clipboardController.reset();
```

## UrlParamsService

Wraps URL search parameter access.

```typescript
import { URLParamsServiceIID } from "@asimojs/mom/services";

const urlParams = await store.context.fetch(URLParamsServiceIID);
const params = urlParams.getURLParams();  // Returns parsed URL params
urlParams.setURLParams({ page: "2" });    // Update URL params
```

### Fake for testing

```typescript
import { createFakeURLParamsService } from "@asimojs/mom/services";

const urlController = createFakeURLParamsService();
urlController.getURLSearch();  // Get raw search string
urlController.reset();
```

## Creating custom services

Follow the same three-part pattern:

1. **Interface + IID** in a types file
2. **Real implementation** using browser APIs
3. **Fake implementation** with a controller for testing

```typescript
// myService/service.types.ts
import { asyncIID } from "@asimojs/asimo";

export interface MyService {
    doSomething(): Promise<string>;
}

export const MyServiceIID = asyncIID<MyService>()("myapp.MyService");
```

```typescript
// myService/service.ts
import { factory } from "@asimojs/asimo";
import { registerRootService } from "@asimojs/mom";
import { MyServiceIID } from "./service.types";

registerRootService(factory({
    provide: [MyServiceIID],
    load: async () => ({
        async doSomething() { return fetch("/api/data").then(r => r.text()); },
    }),
}));
```

```typescript
// myService/service.mock.ts
import { factory } from "@asimojs/asimo";
import { MyServiceIID } from "./service.types";

export function createFakeMyService() {
    let result = "fake-result";
    return {
        factory: factory({
            provide: [MyServiceIID],
            load: async () => ({
                async doSomething() { return result; },
            }),
        }),
        setResult(value: string) { result = value; },
        reset() { result = "fake-result"; },
    };
}
```
