---
title: "Child Stores: Mount & Unmount"
description: Creating and managing child stores with store.mount() and store.unmount()
---

## Mounting child stores

Use `store.mount()` inside a parent store factory to create a child store. It takes the same arguments as `createStore` — a factory and optional params — but establishes a parent-child relationship:

```typescript
const child = store.mount(ChildFactory, { someParam: "value" });
```

Child stores are:
- **Automatically connected** to their parent
- **Automatically disposed** when the parent is disposed (recursively)
- **Sharing** their parent's IoC context by default

:::caution
Always use `store.mount()` for child stores, never `createStore()`. Only `mount` creates the parent-child relationship needed for automatic disposal.
:::

## Eager loading

The simplest approach is to mount all children when the parent is created. Here's a folder store that eagerly loads sub-folders:

```typescript
export const Folder = defineStore(FolderIID, (store, params) => {
    const { data, parent, expanded = false } = params;

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
        },
        expandAll(expanded: boolean) {
            model.expand(expanded);
            for (const folder of model.folders) {
                folder.expandAll(expanded);
            }
        },
        setName(name: string) {
            model.name = name;
        },
    });

    store.onInit(() => {
        model.folders = data.folders?.map((f) =>
            store.mount(Folder, { data: f, parent: store.store })
        ) ?? [];
    });
});
```

Note: `store.store` gives access to the current store instance (available after `initModel` is called). Here it's passed to children so they can compute their `path` from the parent.

## On-demand (lazy) loading

For better performance, load children only when needed — for example, only when a folder is expanded:

```typescript
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

Sub-folder stores are only created when the user expands a folder, keeping memory and initialization costs low.

## Rendering child stores

Since child stores are exposed on the parent model, the view can pass them directly to child components:

```tsx
export const FolderView = observer(({ store }: ViewProps<FolderStore>) => (
    <div>
        <div>
            <ExpandIcon
                expanded={store.isExpanded}
                onClick={() => store.expand(!store.isExpanded)}
            />
            {store.name}
        </div>
        {store.isExpanded && (
            <ul>
                {store.folders.map((folder) => (
                    <li key={folder.$id}>
                        <FolderView store={folder} />
                    </li>
                ))}
                {store.files.map((file, index) => (
                    <li key={`file:${index}`}>{file}</li>
                ))}
            </ul>
        )}
    </div>
));
```

The `$id` metadata property provides a unique key for React lists.

## Unmounting child stores

To dynamically dispose a child store, use `store.unmount()`. It recursively disposes the store and its children, and returns `null` for convenient assignment:

```typescript
// Unmount and clear the reference in one line
model.myChild = store.unmount(model.myChild);
```

After unmounting, the child store's `$state` transitions through `DISPOSING` → `DISPOSED`.

## Next

[Reactivity →](/mom/core-concepts/reactivity)
