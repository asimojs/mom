import { storeFactory } from "@/mom";
import { FolderIID } from "./folder.types";

// section#main
export const Folder = storeFactory(FolderIID, (m, params) => {
    const { data, parent, expanded = false } = params;

    const model = m.makeAutoObservableModel({
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

    m.makeAutoObservableController({
        init() {
            model.folders = data.folders?.map((f) => m.mount({ $store: Folder, data: f, parent: m.store })) ?? [];
        },
    });
});
// /section#main
