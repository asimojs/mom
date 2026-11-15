---
title: Folder (File Explorer)
description: Recursive tree hierarchy — lazy loading, parent references, and expandAll
---

A recursive folder store for a file explorer UI, demonstrating **recursive hierarchies**, **lazy child loading**, and **computed paths**.

## Features used

- Recursive `store.mount()` (Folder mounts child Folders)
- On-demand loading (children load when expanded)
- Computed property using parent store reference
- `initState` for private bookkeeping
- `store.store` for accessing the current store instance

## Types

```typescript
// folder/store.types.ts
import { Store, storeIId } from "@asimojs/mom";

export interface FolderData {
    name?: string;
    files?: string[];
    folders?: FolderData[];
}

type FolderDef = {
    params: {
        data: FolderData;
        parent: FolderStore | null;
        expanded?: boolean;
    };
    model: {
        name: string;
        path: string;
        isExpanded: boolean;
        files: string[];
        folders: FolderStore[];

        expand(expanded: boolean): void;
        expandAll(expanded: boolean): void;
        setName(name: string): void;
    };
};

export type FolderStore = Store<FolderDef>;
export const FolderIID = storeIId<FolderDef>("mom.examples.folder");
```

## Store

```typescript
// folder/store.ts
import { defineStore } from "@asimojs/mom";
import { FolderIID } from "./store.types";

export const Folder = defineStore(FolderIID, (store, params) => {
    const { data, parent, expanded = false } = params;
    let defaultChildExpanded = false;

    const model = store.initModel({
        name: data.name ?? "[Unnamed folder]",
        get path() {
            if (!parent) return "/";
            if (parent.path === "/") return `/${model.name}`;
            return `${parent.path}/${model.name}`;
        },
        isExpanded: expanded,
        files: data.files ?? [],
        folders: [],

        expand(expanded: boolean) {
            model.isExpanded = expanded;
            loadSubFolders();
        },
        expandAll(expanded: boolean) {
            model.expand(expanded);
            defaultChildExpanded = expanded;
            for (const folder of model.folders) {
                folder.expandAll(expanded);
            }
        },
        setName(name: string) {
            model.name = name;
        },
    });

    const state = store.initState({
        loadCompleted: false,
    });

    function loadSubFolders() {
        if (!state.loadCompleted && model.isExpanded) {
            state.loadCompleted = true;
            for (const dataFolder of data.folders ?? []) {
                model.folders.push(
                    store.mount(Folder, {
                        data: dataFolder,
                        parent: store.store,
                        expanded: defaultChildExpanded,
                    })
                );
            }
        }
    }

    store.onInit(() => {
        loadSubFolders();
    });
});
```

### Key patterns

- **Computed `path`** — reads `parent.path` and `model.name`. Since both are observable, the path updates reactively when either changes (e.g. after `setName`)
- **`store.store`** — passes the current store instance as `parent` param to children. Only available after `initModel()` is called
- **Lazy loading** — `loadSubFolders` only runs when `isExpanded` becomes true, controlled by `state.loadCompleted`
- **`expandAll`** — recursively propagates to children, demonstrating parent-to-child coordination

## View

```tsx
// folder/store.view.tsx
import { observer } from "mobx-react-lite";
import { ViewProps } from "@asimojs/mom";
import { FolderStore } from "./store.types";

export const FolderView = observer(({ store, className }: ViewProps<FolderStore>) => (
    <div className={className}>
        <div>
            <span
                style={{ cursor: "pointer" }}
                onClick={() => store.expand(!store.isExpanded)}
            >
                {store.isExpanded ? "📂" : "📁"}
            </span>
            {" "}{store.name}
            {store.path === "/" && (
                <>
                    <button onClick={() => store.expandAll(true)}>Expand All</button>
                    <button onClick={() => store.expandAll(false)}>Collapse All</button>
                </>
            )}
        </div>
        {store.isExpanded && (
            <ul style={{ paddingLeft: "1.5em" }}>
                {store.folders.map((folder) => (
                    <li key={folder.$id}>
                        <FolderView store={folder} />
                    </li>
                ))}
                {store.files.map((file, i) => (
                    <li key={`file:${i}`}>📄 {file}</li>
                ))}
            </ul>
        )}
    </div>
));
```

## Usage

```tsx
import { createStore } from "@asimojs/mom";
import { Folder } from "./folder/store";
import { FolderView } from "./folder/store.view";

const data = {
    name: "root",
    files: ["README.md"],
    folders: [
        { name: "src", files: ["index.ts", "app.ts"], folders: [
            { name: "utils", files: ["helpers.ts"] },
        ]},
        { name: "docs", files: ["guide.md"] },
    ],
};

function App() {
    const [store] = useState(() =>
        createStore(Folder, { data, parent: null, expanded: true })
    );
    return <FolderView store={store} />;
}
```

## Test

```typescript
import { createStore, disposeStore } from "@asimojs/mom";
import { Folder } from "./store";

describe("Folder", () => {
    it("should load children on expand", () => {
        const store = createStore(Folder, {
            data: {
                name: "root",
                folders: [{ name: "child1" }, { name: "child2" }],
            },
            parent: null,
        });

        expect(store.folders.length).toBe(0);  // collapsed by default

        store.expand(true);
        expect(store.folders.length).toBe(2);
        expect(store.folders[0].name).toBe("child1");
        expect(store.folders[0].path).toBe("/root/child1");

        disposeStore(store);
    });
});
```
