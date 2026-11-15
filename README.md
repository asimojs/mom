# mom — MobX micro-stores for React

Mom is an ultra-thin TypeScript library on top of [React] and [MobX] implementing micro-stores organized according to the **Hierarchical Model-View-ViewModel** (HMVVM) pattern. It uses [asimo] for dependency injection.

**[Documentation](https://asimojs.github.io/mom/)**

## Why mom?

Modern React apps mix state, logic, and rendering inside components. As apps grow, this leads to bloated components, tangled prop drilling, and hard-to-test logic buried in hooks and effects.

**Mom fixes this** by extracting all state and logic into small, observable **stores** (ViewModels) that are fully decoupled from your React views. Your components become thin mapping layers — easy to read, easy to swap, easy to test.

- **Full View / Model decoupling** — all state and logic lives in stores. React components only map data to UI — no `useState`, no `useEffect`, no business logic in JSX
- **Testability without the DOM** — all logic is in plain TypeScript stores. Test with vitest/jest directly — no DOM emulation, no React Testing Library gymnastics
- **Readability & maintainability** — prescriptive conventions (one folder per store, standardized file names) make large codebases navigable
- **Progressive application loading** — stores load on demand via the IoC container. Only the code your user needs ships to the browser
- **Composability** — stores compose hierarchically: parent stores mount children, coordinate them, react to their changes
- **Reusable models, swappable views** — the same store can power different React components (desktop vs. mobile, editor vs. read-only)
- **Type safety** — full TypeScript inference across stores, params, models, and views
- **Built-in dependency inversion** — swap real browser APIs for fakes in tests, powered by [asimo]'s IoC containers

## What mom adds to MobX

MobX provides the reactive observable engine. Mom adds the structure to organize it at scale:

- **Lifecycle management** — stores follow a clear `INITIALIZING → READY → DISPOSING → DISPOSED` state machine, with `onInit` and `onDispose` hooks
- **Async initialization and disposal** — stores can fetch data or acquire resources asynchronously at init, and clean up gracefully on dispose
- **Async code loading** — store implementations can be loaded on demand through the IoC container, enabling code splitting *(coming soon)*
- **Strong typings** — models are exposed as `DeepReadOnly` outside the store scope, preventing accidental mutations from views or parent stores
- **Simple conventions** — standardized file structure and naming patterns (`store.ts`, `store.types.ts`, `store.view.tsx`, `XxxDef`, `XxxStore`, `XxxIID`)

## Quick install

```bash
pnpm add @asimojs/mom mobx mobx-react-lite react
```

## Hello World

Define a store — all state and logic in one place:

```typescript
// counter/store.ts
import { defineStore } from "@asimojs/mom";

export const Counter = defineStore((store) => {
    const model = store.initModel({
        value: 0,
        increment() {
            model.value++;
        },
    });
    return model;
});
```

The view just maps data to UI:

```tsx
// counter/store.view.tsx
import { observer } from "mobx-react-lite";

export const CounterView = observer(({ store }: { store: ReturnType<typeof Counter> }) => (
    <div>
        <span>{store.value}</span>
        <button onClick={() => store.increment()}>+1</button>
    </div>
));
```

Mount it in your app:

```tsx
import { createStore } from "@asimojs/mom";
import { Counter } from "./counter/store";
import { CounterView } from "./counter/store.view";
import { useState } from "react";

function App() {
    const [store] = useState(() => createStore(Counter));
    return <CounterView store={store} />;
}
```

## Learn more

- **[Getting Started](https://asimojs.github.io/mom/getting-started/)** — installation and first store
- **[Core Concepts](https://asimojs.github.io/mom/core-concepts/why-stores/)** — MVVM pattern, lifecycle, child stores, reactivity, DI, testing
- **[API Reference](https://asimojs.github.io/mom/api-reference/definestore/)** — full API documentation

## License

MIT

[React]: https://react.dev/
[MobX]: https://mobx.js.org/
[asimo]: https://asimojs.github.io/asimo/
