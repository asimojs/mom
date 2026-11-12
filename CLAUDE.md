# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mom is an ultra-thin TypeScript library on top of React and MobX implementing micro-stores organized according to the Hierarchical Model View Controller (HMVC) pattern. It uses `@asimojs/asimo` for dependency injection.

Package: `@asimojs/mom` (monorepo under `packages/mom/`)

## Commands

All commands run from the repo root:

```bash
pnpm install                # Install dependencies
pnpm test                   # Run tests (vitest in watch mode)
pnpm build                  # Full build: clean + tsc + vite bundle + copy .d.ts
pnpm coverage               # Run tests with coverage report
```

To run a single test file:
```bash
pnpm --filter @asimojs/mom exec vitest run src/tests/init-dispose.spec.ts
```

## Architecture

### Core Concepts

A **Store** is a MobX-observable state object exposed as read-only, with lifecycle management and hierarchical parent-child relationships. Stores are created via factories defined with `defineStore()`.

The lifecycle is: `INITIALIZING → READY → DISPOSING → DISPOSED`

Key APIs (all exported from `mom.ts`):
- `defineStore(iid, factoryFn)` — define a store factory
- `createStore(factory, params)` — instantiate a root store
- `disposeStore(store)` — dispose a root store
- `registerRootService(factory)` — register a service in the root DI container

Inside a factory function, the `StoreContext` provides:
- `initModel(model)` — create the observable model (public data + actions)
- `initState(state)` — create private observable state
- `onInit(fn)` / `onDispose(fn)` — lifecycle hooks
- `mount(factory, params)` / `unmount(store)` — manage child stores
- `autorun()` / `reaction()` — MobX reactions auto-disposed with the store
- `context` — asimo IoC container for fetching services

### Source Layout

```
packages/mom/src/
├── mom.ts              # Core library (~415 lines)
├── mom.types.ts        # Type definitions and interfaces
├── mom.mocks.ts        # Test utilities (pause helper)
├── tests/              # Core test suites (init-dispose, mount-unmount, context, reactions)
├── examples/           # Example stores (counter, simpleCounter, counterList, countdown, folder)
└── services/           # Built-in services (time, storage, clipboard, urlParams)
```

### File Naming Conventions

- Stores: `store.ts`, `store.types.ts`, `store.spec.ts`, `store.view.tsx`, `store.example.tsx`
- Services: `service.ts`, `service.types.ts`, `service.mock.ts`, `service.mock.spec.ts`
- Tests: `*.spec.ts`

### Naming Conventions

- Store definition types: `CounterDef` (contains `params` and `model`)
- Store instance types: `CounterStore` (alias for `Store<CounterDef>`)
- Factory constants: PascalCase (`Counter`)
- Interface IDs: suffixed with `IID` (`CounterIID`, `TimeServiceIID`)
- Store metadata properties use `#` prefix: `#id`, `#state`, `#ready`, `#namespace`

### Store Pattern

```typescript
export const Counter = defineStore(CounterIID, (store, params) => {
    const model = store.initModel({
        value: params.value ?? 0,
        increment(quantity = 1) { model.value += quantity; },
    });
    store.onInit(async () => { /* async setup */ });
    store.onDispose(() => { /* cleanup */ });
});
```

### Dependencies

- Runtime: `@asimojs/asimo` (DI/IoC)
- Peer: `mobx`, `react`, `mobx-react-lite`
- Build: TypeScript 7, Vite 8, Vitest 5

## Formatting

Prettier with 4-space indentation, 120 char print width, trailing commas. No ESLint configured.
