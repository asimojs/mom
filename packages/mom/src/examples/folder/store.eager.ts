import { defineStore } from "@/mom";
import { FolderIID } from "./store.types";

// section#main
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
        folders: [], // init

        /** Change the expand value */
        expand(expanded: boolean) {
            model.isExpanded = expanded;
        },
        /** Recursively expand or collapse the folder and its sub-folders */
        expandAll(expanded: boolean) {
            model.expand(expanded);
            for (const folder of model.folders) {
                folder.expandAll(expanded);
            }
        },
        /** Change the folder name */
        setName(name: string) {
            model.name = name;
        },
    });

    store.makeAutoObservableController({
        init() {
            model.folders = data.folders?.map((f) => store.mount({ $store: Folder, data: f, parent: store.store })) ?? [];
        },
    });
});
// /section#main
