import { Container, AsyncIID, InterfaceId, ServiceFactory, createContainer, factory } from "@asimojs/asimo";
import { StoreFactory, StoreContext, StoreDef, Store } from "./mom.types";
import {
    autorun,
    IReactionDisposer,
    IReactionPublic,
    IAutorunOptions,
    IReactionOptions,
    makeAutoObservable,
    reaction,
    runInAction,
} from "mobx";

/** Registered root service factories, keyed by IID namespace */
const rootServices = new Map<string, ServiceFactory<any, any>>();
let currentContainer = createContainer({ name: "asm" });

function rebuildContainer() {
    const services = Array.from(new Set(rootServices.values()));
    currentContainer = createContainer({ name: "asm", services });
}

/**
 * Register a service factory on the root application context.
 * The root container is rebuilt so that existing children extending it
 * can resolve newly registered services through the stable rootContext proxy.
 */
export function registerRootService(serviceFactory: ServiceFactory<any, any>) {
    for (const iid of serviceFactory.provide) {
        rootServices.set(iid.ns, serviceFactory);
    }
    rebuildContainer();
}

/**
 * Stable root Asimo container proxy, named asm and backed by a mutable container
 * that is rebuilt whenever registerRootService() is called.
 */
export const rootContext: Container<any> = new Proxy(currentContainer, {
    get(_target, prop, _receiver) {
        const value = (currentContainer as any)[prop];
        if (typeof value === "function") {
            return value.bind(currentContainer);
        }
        return value;
    },
});

/** Store counter to generate unique ids */
let storeCount = 0;

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
    reactionDisposers: IReactionDisposer[] | null;
    init: (() => void | Promise<void>) | null;
    dispose: (() => void) | null;
    resolveInit: (() => void) | null;
    resolveDispose: (() => void) | null;
    rejectInit: ((reason?: any) => void) | null;
    rejectDispose: ((reason?: any) => void) | null;
}

/**
 * Create a Store factory
 * @param factory the store creation function
 */
export function defineStore<SD extends StoreDef<object, object>>(
    createFn: (store: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD>;
/**
 * Create a Store factory associated to a Store Interface Id (aka. IID)
 * @param storeIID the store interface id (creatred with storeIId())
 * @param createFn the store creation function
 */
export function defineStore<SD extends StoreDef<object, object>>(
    storeIID: InterfaceId<StoreFactory<SD>> | string,
    createFn: (store: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD>;

export function defineStore<SD extends StoreDef<object, object>>(
    storeIIDorFactory: InterfaceId<StoreFactory<SD>> | string | ((store: StoreContext<SD>, p: SD["params"]) => void),
    createFn?: (store: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD> {
    let storeIID: AsyncIID<StoreFactory<SD>> | null = null;
    let ns = "";

    if (typeof storeIIDorFactory === "function") {
        createFn = storeIIDorFactory as (store: StoreContext<SD>, p: SD["params"]) => void;
    } else {
        if (typeof storeIIDorFactory === "string") {
            ns = storeIIDorFactory;
        } else {
            storeIID = storeIIDorFactory as AsyncIID<StoreFactory<SD>>;
            ns = storeIIDorFactory.ns;
        }
    }

    if (!createFn) {
        // TODO error
        throw "Invalid Store Factory function";
    }

    function stFactory(store: StoreContext<SD>, params: SD["params"]): Store<SD> {
        createFn!(store, params); // TODO: try/catch
        const mi = store as StoreInternalContext<SD>;
        processLifeCycleFunction("INIT", mi);
        return mi.store!;
    }
    (stFactory as unknown as Writeable<StoreFactory<SD>>)["#namespace"] = ns;
    if (storeIID) {
        registerRootService(
            factory({
                provide: [storeIID],
                load: async () => stFactory as StoreFactory<SD>,
            }),
        );
    }
    return stFactory as StoreFactory<SD>;
}

/**
 * Load a root store.
 * Note: if the store is a child of another store, then you should use
 * store.mount() in the parent store instead
 * @param params the store params
 * @returns the store instance
 */
export function createStore<SD extends StoreDef<object, object>>(
    storeFactory: StoreFactory<SD>,
    params?: SD["params"] & { context?: Container<any> },
): Store<SD> {
    let rootCtxt: StoreInternalContext<any> | null = null;
    const store = _createStore(null, storeFactory, params ?? {} as SD["params"], params?.context ?? rootContext);
    (store as any).$dispose = () => {
        if (rootCtxt) {
            disposeCtxt(rootCtxt);
        }
    };
    return store as Store<SD>;

    function _createStore(
        parent: StoreInternalContext<any> | null,
        storeFactory: StoreFactory<SD>,
        params: SD["params"],
        context: Container<any>,
    ) {
        const mi = createStoreInternalContext(parent, storeFactory, params, context);

        storeFactory(mi, params); // TODO: try/catch

        if (mi.store === null) {
            // TODO: MomError
            throw `[${storeFactory["#namespace"]}] Invalid Component function: store.initModel() was not called`;
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
        context: Container<any>,
    ): StoreInternalContext<SD> {
        let createModelCalled = false;
        let initStateCalled = false;
        let autoRunCount = 0;
        let reactionCount = 0;
        const ns = stFactory["#namespace"];
        const storeId = `${ns}#${++storeCount}`;

        const momCtxt: StoreInternalContext<SD> = {
            parentCtxt: parent,
            childCtxts: null,
            context,
            init: null,
            dispose: null,
            resolveInit: null,
            rejectInit: null,
            resolveDispose: null,
            rejectDispose: null,
            store: null as Store<SD> | null,
            reactionDisposers: null,
            initModel(initialModel: SD["model"]): SD["model"] {
                if (createModelCalled) {
                    // TODO: MomError
                    throw "Invalid Component function: store.initModel() must only be called once";
                }
                if (!initialModel) {
                    // TODO: MomError
                    throw "initialModel cannot be undefined";
                }
                const str = initialModel as Store<SD>;
                const st: Writeable<Store<any>> = str;
                st["#namespace"] = ns;
                st["#id"] = storeId;
                st["#context"] = parent?.context || context;
                st["#ready"] = false;
                st["#state"] = "INITIALIZING";
                st["#initComplete"] = new Promise((resolve, reject) => {
                    momCtxt.resolveInit = () => {
                        st["#state"] = "READY";
                        st["#ready"] = true;
                        resolve(undefined);
                    };
                    momCtxt.rejectInit = reject;
                });
                st["#disposeComplete"] = new Promise((resolve, reject) => {
                    momCtxt.resolveDispose = () => {
                        st["#state"] = "DISPOSED";
                        st["#ready"] = false;
                        resolve(undefined);
                    };
                    momCtxt.rejectDispose = reject;
                });

                this.store = makeAutoObservable(initialModel) as Store<SD>;
                return this.store!;
            },
            initState<S extends object>(state: S): S {
                if (initStateCalled) {
                    throw "Invalid Component function: store.initState() must only be called once";
                }
                initStateCalled = true;
                return makeAutoObservable(state);
            },
            onInit(fn: () => void | Promise<void>): void {
                if (this.init) {
                    throw "Invalid Component function: store.onInit() must only be called once";
                }
                this.init = fn;
            },
            onDispose(fn: () => void | Promise<void>): void {
                if (this.dispose) {
                    throw "Invalid Component function: store.onDispose() must only be called once";
                }
                this.dispose = fn;
            },
            createChildContext(services?: ServiceFactory<any, any>[]): void {
                this.context = createContainer({ name: storeId, extends: [this.context], services });
            },
            mount<SD extends StoreDef<any, any>>(storeFactory: StoreFactory<SD>, params?: SD["params"]): Store<SD> {
                return _createStore(momCtxt, storeFactory, params ?? {} as SD["params"], this.context);
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
            autorun(effect: (r: IReactionPublic) => any, options: IAutorunOptions = {}) {
                setReactionOptions(this, "autorun", options);
                const disposer = autorun(effect, options);
                reactionDisposers(this).push(disposer);
                return disposer;
            },
            reaction<T, FireImmediately extends boolean = true>(
                expression: (r: IReactionPublic) => T,
                effect: (arg: T, prev: FireImmediately extends true ? T | undefined : T, r: IReactionPublic) => void,
                options: IReactionOptions<T, FireImmediately> = {},
            ): IReactionDisposer {
                setReactionOptions(this, "reaction", options);
                const disposer = reaction(
                    expression,
                    (arg, prev, r) => runInAction(() => effect(arg, prev, r)),
                    options,
                );
                reactionDisposers(this).push(disposer);
                return disposer;
            },
        };
        if (!rootCtxt) {
            rootCtxt = momCtxt;
        }
        return momCtxt;

        function setReactionOptions(
            mi: StoreInternalContext<SD>,
            scope: "autorun" | "reaction",
            options: IAutorunOptions | IReactionOptions<any, any>,
        ) {
            if (!mi.store) {
                throw `[${scope}] Reactions must be defined after initModel()`;
            }
            if (!options.name) {
                const count = scope === "autorun" ? ++autoRunCount : ++reactionCount;
                options.name = `${mi.store["#id"]}:${scope}:${count}`;
            }
            if (!options.onError) {
                // TODO
            }
            if (scope === "reaction" && (options as IReactionOptions<any, any>).fireImmediately !== false) {
                (options as IReactionOptions<any, any>).fireImmediately = true;
            }
            // options.scheduler = async (callback: () => void) => {
            //     Promise.resolve().then(callback);
            // };
        }
    }

    function reactionDisposers(mi: StoreInternalContext<SD>) {
        if (!mi.reactionDisposers) {
            mi.reactionDisposers = [];
        }
        return mi.reactionDisposers;
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

        // dispose reactions
        if (mi.reactionDisposers) {
            mi.reactionDisposers.forEach((disposer) => disposer());
        }

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
 * Dispose a root store (created with createStore).
 * Note: child stores created with store.mount() should be disposed with store.unmount()
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
    const reject = name === "INIT" ? mi.rejectInit : mi.rejectDispose;
    if (initOrDispose) {
        try {
            const result = initOrDispose();
            if (isPromise(result)) {
                result
                    .then(() => {
                        resolve?.();
                    })
                    .catch((ex) => {
                        // TODO error
                        reject?.(`Unexpected Store error during ${name}: ${ex}`);
                    });
            } else {
                resolve?.();
            }
        } catch (ex) {
            // TODO Error
            reject?.(`Unexpected Store error during ${name}: ${ex}`);
        }
    } else {
        resolve?.();
    }
}
