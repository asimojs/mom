import { Store, storeIId } from "@/mom.types";

// section#main
type FolderDef = {
    params: {
        /** The folder data retrieved from the domain layer */
        data: FolderData;
        /** The parent folder or null for the root folder */
        parent: Folder | null;
        /** Tell if the folder should be expanded */
        expanded?: boolean;
    };
    model: {
        /** The folder name */
        name: string;
        /** The folder path (e.g. "/foo/bar") */
        path: string;
        /** Tell if the folder view should be expanded or collapsed */
        isExpanded: boolean;
        /** The files contained in this folder */
        files: string[];
        /** The sub-folders contained in this folder */
        folders: Folder[];

        /** Change the expand value */
        expand(expanded: boolean): void;
        /** Recursively expand or collapse the folder and its sub-folders */
        expandAll(expanded: boolean): void;
        /** Change the folder name */
        setName(name: string): void;
    };
};
// /section#main

// section#folderdata
export interface FolderData {
    name?: string;
    files?: string[];
    folders?: FolderData[];
}
// /section#folderdata

export type Folder = Store<FolderDef>;
export const FolderSID = storeIId<FolderDef>("mom.examples.Folder");
