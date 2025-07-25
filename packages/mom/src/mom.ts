import { InterfaceId } from "@asimojs/asimo/dist/asimo.types";
import { StoreFactory, StoreContext, StoreDef, Store, StoreInternalController } from "./mom.types";
import { asm } from "@asimojs/asimo";
import { makeAutoObservable } from "mobx";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
/** Weak map of all root stores */
const rootInternalContextByStores = new WeakMap<Store<any>, StoreInternalContext<any>>();

/**
 * Enriched StoreContext with internal properties/methods
 * that should not be visible to the component developer to limit confusion/errors
 */
interface StoreInternalContext<SD extends StoreDef<any, any>> extends StoreContext<SD> {
    store: Store<SD> | null;
    parentCtxt: StoreInternalContext<any> | null;
    childCtxts: Map<Store<any>, StoreInternalContext<any>> | null;
    init: (() => void | Promise<void>) | null;
    dispose: (() => void) | null;
    resolveInit: (() => void) | null;
    resolveDispose: (() => void) | null;
}

/**
 * Create a Store factory
 * @param factory the store creation function
 */
export function storeFactory<SD extends StoreDef<object, object>>(
    factory: (m: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD>;
/**
 * Create a Store factory associated to a Store Interface Id (aka. SID)
 * @param storeSID the store interface id (creatred with storeIId())
 * @param factory the store creation function
 */
export function storeFactory<SD extends StoreDef<object, object>>(
    storeSID: InterfaceId<StoreFactory<SD>> | string,
    factory: (m: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD>;

export function storeFactory<SD extends StoreDef<object, object>>(
    storeSIDorFactory: InterfaceId<StoreFactory<SD>> | string | ((m: StoreContext<SD>, p: SD["params"]) => void),
    factory?: (m: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD> {
    let storeSID: InterfaceId<StoreFactory<SD>> | null = null;
    let ns = "";

    if (typeof storeSIDorFactory === "function") {
        factory = storeSIDorFactory as (m: StoreContext<SD>, p: SD["params"]) => void;
    } else {
        if (typeof storeSIDorFactory === "string") {
            ns = storeSIDorFactory;
        } else {
            storeSID = storeSIDorFactory;
            ns = storeSIDorFactory.ns;
        }
    }

    if (!factory) {
        // TODO error
        throw "Invalid Store Factory function";
    }

    function stFactory(m: StoreContext<SD>, params: SD["params"]): Store<SD> {
        factory!(m, params); // TODO: try/catch
        const mi = m as StoreInternalContext<SD>;
        processLifeCycleFunction("INIT", mi);
        return mi.store!;
    }
    (stFactory as unknown as Writeable<StoreFactory<SD>>)["#namespace"] = ns;
    if (storeSID) {
        asm.registerFactory(storeSID, () => stFactory as StoreFactory<SD>);
    }
    return stFactory as StoreFactory<SD>;
}

/**
 * Load a root store.
 * Note: if the store is a child of another store, then you should use
 * m.mount() in the parent store instead
 * @param params the store params
 * @returns the store instance
 */
export function loadStore<SD extends StoreDef<object, object>>(
    params: { $store: StoreFactory<SD> } & SD["params"],
): Store<SD> {
    const context = asm; // TODO: use context param or mom config

    let rootCtxt: StoreInternalContext<any> | null = null;
    const store = _loadStore(null, params);
    (store as any).$dispose = () => {
        if (rootCtxt) {
            disposeCtxt(rootCtxt);
        }
    };
    return store as Store<SD>;

    function _loadStore(parent: StoreInternalContext<any> | null, params: { $store: StoreFactory<SD> } & SD["params"]) {
        const stFactory = params.$store;
        params.$store = null as any;

        const mi = createStoreInternalContext(parent, stFactory, params);

        stFactory(mi, params); // TODO: try/catch

        if (mi.store === null) {
            // TODO: MomError
            throw `[${stFactory["#namespace"]}] Invalid Component function: m.createModel() was not called`;
        }

        if (parent) {
            if (!parent.childCtxts) {
                parent.childCtxts = new Map();
            }
            parent.childCtxts.set(mi.store, mi);
        }

        if (!parent) {
            // this is a root store
            rootInternalContextByStores.set(mi.store, mi);
        }

        return mi.store;
    }

    function createStoreInternalContext(
        parent: StoreInternalContext<any> | null,
        stFactory: StoreFactory<SD>,
        params: SD["params"],
    ): StoreInternalContext<SD> {
        let createModelCalled = false;
        const momCtxt: StoreInternalContext<SD> = {
            parentCtxt: parent,
            childCtxts: null,
            context,
            init: null,
            dispose: null,
            resolveInit: null,
            resolveDispose: null,
            store: null as Store<SD> | null,
            makeAutoObservableModel(initialModel: SD["model"]): SD["model"] {
                if (createModelCalled) {
                    // TODO: MomError
                    throw "Invalid Component function: m.createModel() must only be called once";
                }
                if (!initialModel) {
                    // TODO: MomError
                    throw "initialModel cannot be undefined";
                }
                const str = initialModel as Store<SD>;
                const st: Writeable<Store<any>> = str;
                st["#namespace"] = stFactory["#namespace"];
                st["#context"] = parent?.context || asm;
                st["#ready"] = false;
                st["#state"] = "INITIALIZING";
                st["#initComplete"] = new Promise((resolve) => {
                    momCtxt.resolveInit = () => {
                        st["#state"] = "READY";
                        st["#ready"] = true;
                        resolve();
                    };
                });
                st["#disposeComplete"] = new Promise((resolve) => {
                    momCtxt.resolveDispose = () => {
                        st["#state"] = "DISPOSED";
                        st["#ready"] = false;
                        resolve();
                    };
                });

                this.store = makeAutoObservable(initialModel) as Store<SD>;
                return this.store!;
            },
            makeAutoObservableController<C extends StoreInternalController>(controller: C): C {
                const ctl = makeAutoObservable(controller);
                if (ctl.init) {
                    this.init = ctl.init.bind(ctl);
                }
                if (ctl.dispose) {
                    this.dispose = ctl.dispose.bind(ctl);
                }
                return ctl;
            },
            mount<SD extends StoreDef<any, any>>(params: { $store: StoreFactory<SD> } & SD["params"]): Store<SD> {
                return _loadStore(momCtxt, params);
            },
            unmount(store: Store<any> | null): null {
                if (store) {
                    disposeStore(momCtxt, store as any);
                }
                return null;
            },
            terminate() {
                disposeCtxt(this);
            },
        };
        if (!rootCtxt) {
            rootCtxt = momCtxt;
        }
        return momCtxt;
    }

    function disposeStore(parentCtxt: StoreInternalContext<any>, store: Store<any>) {
        const mi = parentCtxt.childCtxts?.get(store);
        if (mi) {
            // remove from parent map
            parentCtxt.childCtxts!.delete(store);
            disposeCtxt(mi);
        }
    }

    function disposeCtxt(mi: StoreInternalContext<any>) {
        const model = mi.store as Writeable<Store<any>> | null;
        if (!model || model["#state"] === "DISPOSED" || model["#state"] === "DISPOSING") return;
        model["#state"] = "DISPOSING";
        model["#ready"] = false;

        // TODO: dispose reactions

        // call dispose on all child components
        if (mi.childCtxts) {
            for (const c of mi.childCtxts.values()) {
                disposeCtxt(c);
            }
            mi.childCtxts = null;
        }

        processLifeCycleFunction("DISPOSE", mi);
    }
}

/**
 * Dispose a root store (created with loadStore).
 * Note: child stores created with m.mount() should be disposed with m.unmount()
 * @param store
 * @returns true if the store was propertly disposed
 */
export function disposeStore<SD extends StoreDef<object, object>>(store: Store<SD>): boolean {
    const mi = rootInternalContextByStores.get(store);
    if (mi) {
        mi.terminate?.();
        rootInternalContextByStores.delete(store);
        return true;
    }
    return false;
}

function isPromise(p: any): p is Promise<unknown> {
    return !!p && typeof p === "object" && typeof p.then === "function";
}

function processLifeCycleFunction(name: "INIT" | "DISPOSE", mi: StoreInternalContext<any>) {
    const initOrDispose = name === "INIT" ? mi.init : mi.dispose;
    const resolve = name === "INIT" ? mi.resolveInit : mi.resolveDispose;
    if (initOrDispose) {
        try {
            const result = initOrDispose();
            if (isPromise(result)) {
                result.then(() => {
                    resolve?.();
                });
            } else {
                resolve?.();
            }
        } catch (ex) {
            // TODO error
            throw `Unexpected Store error during ${name}: ${ex}`;
        }
    } else {
        resolve?.();
    }
}
