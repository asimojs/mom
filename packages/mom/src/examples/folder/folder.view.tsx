import { observer } from "mobx-react-lite";
import { Folder } from "./folder.types";
import { ViewProps } from "@/mom.types";

// section#main
export const FolderView = observer(({ store, className }: ViewProps<Folder>) => {
    return (
        <div className={className}>
            <div>
                <ExpandIcon expanded={store.isExpanded} onClick={() => store.expand(!store.isExpanded)} />
                {store.name}
                {store.path === "/" && (
                    <>
                        <button onClick={() => store.expandAll(true)}> Expand All </button>
                        <button onClick={() => store.expandAll(false)}> Collapse All </button>
                    </>
                )}
            </div>
            {store.isExpanded && (
                <ul className="p-2">
                    {store.folders.map((folder) => (
                        <li key={folder["#id"]}>
                            <FolderView store={folder} />
                        </li>
                    ))}
                    {store.files.map((file, index) => (
                        <li key={`file:${index}`}>{file}</li>
                    ))}
                </ul>
            )}
        </div>
    );
});
// /section#main

export const ExpandIcon = observer(({ expanded, onClick }: { expanded: boolean; onClick?: () => void }) => {
    return (
        <div className="relative -top-0.5 cursor-pointer pe-2 text-3xl" onClick={onClick}>
            {expanded ? "▾" : "▸"}
        </div>
    );
});
