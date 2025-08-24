import { IoCContainer, InterfaceId, AsyncIID } from "@asimojs/asimo/dist/asimo.types";
import { StoreFactory, StoreContext, StoreDef, Store, StoreInternalController } from "./mom.types";
import { asm, createContainer } from "@asimojs/asimo";
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
}

/**
 * Create a Store factory
 * @param factory the store creation function
 */
export function storeFactory<SD extends StoreDef<object, object>>(
    factory: (m: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD>;
/**
 * Create a Store factory associated to a Store Interface Id (aka. IID)
 * @param storeIID the store interface id (creatred with storeIId())
 * @param factory the store creation function
 */
export function storeFactory<SD extends StoreDef<object, object>>(
    storeIID: InterfaceId<StoreFactory<SD>> | string,
    factory: (m: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD>;

export function storeFactory<SD extends StoreDef<object, object>>(
    storeIIDorFactory: InterfaceId<StoreFactory<SD>> | string | ((m: StoreContext<SD>, p: SD["params"]) => void),
    factory?: (m: StoreContext<SD>, p: SD["params"]) => void,
): StoreFactory<SD> {
    let storeIID: AsyncIID<StoreFactory<SD>> | null = null;
    let ns = "";

    if (typeof storeIIDorFactory === "function") {
        factory = storeIIDorFactory as (m: StoreContext<SD>, p: SD["params"]) => void;
    } else {
        if (typeof storeIIDorFactory === "string") {
            ns = storeIIDorFactory;
        } else {
            storeIID = storeIIDorFactory as AsyncIID<StoreFactory<SD>>;
            ns = storeIIDorFactory.ns;
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
    if (storeIID) {
        asm.registerFactory(storeIID, () => stFactory as StoreFactory<SD>);
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
export function createStore<SD extends StoreDef<object, object>>(
    params: { $store: StoreFactory<SD>; $context?: IoCContainer } & SD["params"],
): Store<SD> {
    let rootCtxt: StoreInternalContext<any> | null = null;
    const store = _createStore(null, params, params.$context ?? asm);
    (store as any).$dispose = () => {
        if (rootCtxt) {
            disposeCtxt(rootCtxt);
        }
    };
    return store as Store<SD>;

    function _createStore(
        parent: StoreInternalContext<any> | null,
        params: { $store: StoreFactory<SD> } & SD["params"],
        context: IoCContainer,
    ) {
        const stFactory = params.$store;
        params.$store = null as any;

        const mi = createStoreInternalContext(parent, stFactory, params, context);

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
        context: IoCContainer,
    ): StoreInternalContext<SD> {
        let createModelCalled = false;
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
            resolveDispose: null,
            store: null as Store<SD> | null,
            reactionDisposers: null,
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
                st["#namespace"] = ns;
                st["#id"] = storeId;
                st["#context"] = parent?.context || context;
                st["#ready"] = false;
                st["#state"] = "INITIALIZING";
                st["#initComplete"] = new Promise((resolve) => {
                    momCtxt.resolveInit = () => {
                        st["#state"] = "READY";
                        st["#ready"] = true;
                        resolve(undefined);
                    };
                });
                st["#disposeComplete"] = new Promise((resolve) => {
                    momCtxt.resolveDispose = () => {
                        st["#state"] = "DISPOSED";
                        st["#ready"] = false;
                        resolve(undefined);
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
            createChildContext(): void {
                this.context = createContainer({ parent: this.context, name: storeId });
            },
            mount<SD extends StoreDef<any, any>>(params: { $store: StoreFactory<SD> } & SD["params"]): Store<SD> {
                return _createStore(momCtxt, params, this.context);
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
                throw `[${scope}] Reactions must be defined after makeAutoObservableModel()`;
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
