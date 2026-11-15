---
title: Naming & File Conventions
description: Store files, naming patterns, and project organization
---

Mom is prescriptive about conventions. Consistent naming makes codebases predictable for both humans and AI tools.

## File structure

Each store lives in its own folder named after the feature:

```
counter/
├── store.types.ts       # Public API: types + IID
├── store.ts             # Implementation: factory
├── store.view.tsx       # React component(s)
├── store.spec.ts        # Tests
└── store.example.tsx    # Usage example (optional)
```

For large modules with multiple views:

```
dashboard/
├── store.types.ts
├── store.ts
├── store.main.view.tsx
├── store.header.view.tsx
├── store.sidebar.view.tsx
└── store.spec.ts
```

### Services

```
timeService/
├── service.types.ts     # Interface + IID + fake controller type
├── service.ts           # Browser implementation
├── service.mock.ts      # Fake implementation for testing
└── service.mock.spec.ts # Tests for the mock itself
```

## Naming patterns

### Type names

| Pattern | Example | Purpose |
|---------|---------|---------|
| `XxxDef` | `CounterDef` | Store definition type (`{ params, model }`) |
| `XxxStore` | `CounterStore` | Public store type (`Store<CounterDef>`) |
| `XxxIID` | `CounterIID` | Store interface identifier |

### Factory constants

Factory names use **PascalCase** and match the feature name:

```typescript
export const Counter = defineStore(CounterIID, (store, params) => { /* ... */ });
export const LoginForm = defineStore((store) => { /* ... */ });
export const TextInput = defineStore((store, params) => { /* ... */ });
```

### Service names

| Pattern | Example | Purpose |
|---------|---------|---------|
| `XxxService` | `TimeService` | Service interface |
| `XxxServiceIID` | `TimeServiceIID` | Service IID |
| `FakeXxxController` | `FakeTimeServiceController` | Test controller type |
| `createFakeXxx()` | `createFakeTimeService()` | Creates a fake instance |

### Metadata properties

Store metadata uses the `#` prefix to avoid collisions with model properties:

- `#id` — unique instance identifier (e.g. `"myapp.counter#42"`)
- `#namespace` — IID namespace (e.g. `"myapp.counter"`)
- `#state` — lifecycle state
- `#ready` — boolean shorthand for `#state === "READY"`
- `#initComplete` — promise for init completion
- `#disposeComplete` — promise for dispose completion
- `#context` — IoC container reference

### IID namespaces

Use dot-separated namespaces that reflect your project structure:

```typescript
storeIId<CounterDef>("myapp.counter")
storeIId<FolderDef>("myapp.fileExplorer.folder")
asyncIID<TimeService>()("myapp.services.TimeService")
```

## Import conventions

- **Types file** — import types and IIDs from `store.types.ts`
- **Implementation** — import the factory from `store.ts`
- **View** — import the store type from `store.types.ts`, the factory from `store.ts`
- **Parent stores** — import only types and IIDs from children (never implementations) to preserve code splitting

```typescript
// In a parent store:
import { ChildStore, ChildIID } from "../child/store.types";  // ✓ types only
import { Child } from "../child/store";                        // ✗ breaks code splitting
```

## Project organization

Group related stores in directories:

```
src/
├── stores/
│   ├── counter/
│   ├── counterList/
│   ├── loginForm/
│   ├── textInput/
│   └── action/
├── services/
│   ├── timeService/
│   ├── storageService/
│   └── clipboardService/
└── App.tsx
```
