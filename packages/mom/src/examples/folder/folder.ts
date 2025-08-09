import { storeFactory } from "@/mom";
import { FolderSID } from "./folder.types";

// section#main
export const FolderStore = storeFactory(FolderSID, (m, params) => {
    const { data, parent, expanded = false } = params;
    let defaultChildExpanded = false;

    const model = m.makeAutoObservableModel({
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

    const controller = m.makeAutoObservableController({
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
                        // m.mount returns a new FolderStore instance
                        m.mount({
                            $store: FolderStore,
                            data: dataFolder,
                            parent: m.store,
                            expanded: defaultChildExpanded,
                        }),
                    );
                }
            }
        },
    });
});
// /section#main
