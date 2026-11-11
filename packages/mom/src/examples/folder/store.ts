import { defineStore } from "@/mom";
import { FolderIID, FolderStore } from "./store.types";

// section#main
export const Folder = defineStore(FolderIID, (store, params) => {
    const { data, parent, expanded = false } = params;
    let defaultChildExpanded = false;

    const model = store.initModel({
        name: data.name ?? "[Unnamed folder]",
        get path() {
            if (!parent) return `/`;
            if (parent.path === "/") return `/${model.name}`;
            return `${parent.path}/${model.name}`;
        },
        isExpanded: expanded,
        files: data.files ?? [],
        folders: [], // loaded dynamically

        /** Change the expand value */
        expand(expanded: boolean) {
            model.isExpanded = expanded;
            controller.loadSubFolders();
        },
        /** Recursively expand or collapse the folder and its sub-folders */
        expandAll(expanded: boolean) {
            model.expand(expanded);
            defaultChildExpanded = expanded;
            for (const folder of model.folders) {
                folder.expandAll(expanded);
            }
        },
        /** Change the folder name */
        setName(name: string) {
            model.name = name;
        },
    });

    const controller = store.makeAutoObservableController({
        loadCompleted: false,
        init() {
            this.loadSubFolders();
        },
        loadSubFolders() {
            // only load the sub-folders if the folder is expanded
            if (!this.loadCompleted && model.isExpanded) {
                this.loadCompleted = true;
                for (const dataFolder of data.folders ?? []) {
                    model.folders.push(
                        // store.mount returns a new FolderStore instance
                        store.mount({
                            $store: Folder,
                            data: dataFolder,
                            parent: store.store,
                            expanded: defaultChildExpanded,
                        }),
                    );
                }
            }
        },
    });
});
// /section#main
