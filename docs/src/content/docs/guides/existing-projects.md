---
title: Integrating into Existing Projects
description: Incremental adoption in React and Preact codebases
---

Mom can be adopted incrementally — you don't need to rewrite your entire application.

## Adding mom to a React project

### 1. Install dependencies

```bash
pnpm add @asimojs/mom mobx mobx-react-lite
```

If you're using React 18+, these are the only dependencies needed. `@asimojs/asimo` is installed automatically as a transitive dependency.

### 2. Create your first store

Pick a self-contained feature in your app — a form, a settings panel, a sidebar — and extract its state into a mom store. See [Getting Started](/mom/getting-started) for the step-by-step pattern.

### 3. Mount the store in your existing component tree

Use `createStore` + `useState` to mount the store inside any existing React component:

```tsx
import { createStore } from "@asimojs/mom";
import { MyFeature } from "./myFeature/store";
import { MyFeatureView } from "./myFeature/store.view";
import { useState } from "react";

function ExistingPage() {
    const [store] = useState(() => createStore(MyFeature, { /* params */ }));

    return (
        <div>
            <h1>Existing page content</h1>
            {/* Mom-powered component alongside existing React components */}
            <MyFeatureView store={store} />
        </div>
    );
}
```

Mom components coexist with standard React components — there's no global provider or context wrapper required.

### 4. Dispose on unmount (optional)

If the mom component might unmount during the app lifetime (e.g. in a tab or route), dispose the store to clean up:

```tsx
import { createStore, disposeStore } from "@asimojs/mom";
import { useEffect, useState } from "react";

function ExistingPage() {
    const [store] = useState(() => createStore(MyFeature));

    useEffect(() => {
        return () => { disposeStore(store); };
    }, [store]);

    return <MyFeatureView store={store} />;
}
```

## Compatibility with UI libraries

Mom stores manage state; they don't render UI. Your view components can use any React UI library:

- **shadcn/ui** — pass store values as props to shadcn components
- **Material UI** — same approach, store drives the state
- **Headless UI** — combine with store actions for behavior
- **Tailwind CSS** — use `className` from `ViewProps` for styling

Example with a generic UI input:

```tsx
export const TextInputView = observer(({ store }: ViewProps<TextInputStore>) => (
    <div>
        <input
            type={store.password && !store.showPassword ? "password" : "text"}
            value={store.value}
            disabled={store.disabled}
            onChange={(e) => store.setValue(e.target.value)}
        />
        {store.error && <span className="error">{store.errorMessage}</span>}
    </div>
));
```

The view maps store state to whatever UI components you use.

## Preact compatibility

Mom works with Preact + `mobx-react-lite`. Replace `react` imports with `preact/compat` as usual:

```json
// vite.config.ts alias
{
    "react": "preact/compat",
    "react-dom": "preact/compat"
}
```

## Migration strategy

1. **Start small** — pick one feature, extract its state into a store
2. **Keep existing components** — mom views coexist with hooks-based components
3. **Expand gradually** — as you touch features, migrate them to stores
4. **Share services** — register shared services (API clients, auth) on `rootContext` for use across stores
5. **Build the hierarchy** — as more features use stores, connect them through the HMVVM tree
