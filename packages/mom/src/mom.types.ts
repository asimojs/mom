import { AsmContext, InterfaceId, InterfaceNamespace } from "@asimojs/asimo/dist/asimo.types";
import { interfaceId as _interfaceId } from "@asimojs/asimo";

/** Create an interface identifier */
export const interfaceId = _interfaceId;

export function storeIId<D extends StoreDef<any, any>>(ns: InterfaceNamespace) {
    return interfaceId<StoreFactory<D>>(ns);
}

export type IIDType<T extends InterfaceId<any>> = T extends InterfaceId<infer IType> ? IType : never;
// ex: let x: IIDType<typeof BasicCounterSID>;

/**
 * Mom Store Factory - to instantitate Mom Stores
 */
export interface StoreFactory<D extends StoreDef<any, any>> {
    /** Component namespace (= IID namespace) */
    readonly "#namespace": string;
    (m: StoreContext<D>, params: D["params"]): Store<D>;
}

/**
 * Store-specific context passed as first argument of the createStore function
 */
export interface StoreContext<D extends StoreDef<any, any>> {
    /**
     * The context associated to the component - allows to pass objects or dependencies
     * to all child components without definining explicit props
     * Note: can be overridden with a child context to limit impact on the parent context
     **/
    context: AsmContext;
    /**
     * Create the Mobx Observable object that will be used as store model.
     * This method is a simple (typed) wrapper on the mobx makeAutoObservable function -
     * so all mobx features can be used here.
     * @see https://mobx.js.org/observable-state.html#makeautoobservable
     **/
    makeAutoObservableModel(initialModel: D["model"]): D["model"];
    /**
     * Create internal actions and observable state values that will not be exposed to the store users.
     * The store init() and dispose() methods should be defined here.
     * Note: this method is a simple wrapper on the mobx makeAutoObservable function -
     * so all mobx features can be used here.
     * @see https://mobx.js.org/observable-state.html#makeautoobservable
     * @param actions
     */
    makeAutoObservableController<A extends StoreInternalController>(actions: A): A;
    /**
     * Mount a child component that should be attached to the parent's model
     * This will:
     * - call the component init()
     * - set and update the component.$ready and component.$initiComplete properties
     * e.g. model.myCpt = m.mount({$cpt: MyCpt, myprop:"hello"});
     **/
    mount<SD extends StoreDef<any, any>>(params: { $store: StoreFactory<SD> } & SD["params"]): Store<SD>;
    /**
     * Unmount a component - this will:
     * - recursively call the dispose methods of the component and child components
     * - set the component.$disposed to true
     * - set the component.$ready to false and change the component.$initComplete property
     * Note: this will not automatically detach the component (i.e. set its parent reference to null)
     * This will have to be done manually - e.g.
     * model.myCpt = m.unmount(model.myCpt);
     * @param cpt
     * @return null
     */
    unmount(store: Store<any> | null): null;
    /**
     * Trigger the store disposal
     */
    terminate(): void;
}

export interface StoreInternalController {
    init?(): void;
    dispose?(): void;
}

/**
 * Default View props for a store React component
 */
export interface ViewProps<S extends Store<any>> {
    store: S;
    className?: string;
}

/**
 * The Store lifecycle state
 * - INITIALIZING: initialization has started and is not complete
 * - READY: the store is initialized (init complete)
 * - DISPOSING: the store is being disposed and disposal is not complete
 * - DISPOSED: the store is disposed and will not function anymore. Store references should be removed (remaining data can be read though)
 */
type StoreState = "INITIALIZING" | "READY" | "DISPOSING" | "DISPOSED";

/**
 * Meta data added by Mom to all Mom stores
 */
export interface StoreMetaData {
    /** The store namespace */
    readonly "#namespace": string;
    /** The context associated to the store - allows to share or retrieve dependencies */
    readonly "#context": AsmContext;
    /** The store life cycle state from INITIALIZING to DISPOSED */
    readonly "#state": StoreState;
    /** True when the store state is READY */
    readonly "#ready": boolean;
    /** Promise resolving when initialization is complete and when the store is NOT disposed */
    readonly "#initComplete": Promise<void>;
    /** Promise resolving when dispose is complete */
    readonly "#disposeComplete": Promise<void>;
}

/** Define a Mom Model from its Params and State */
export type Store<D extends StoreDef<any, any>> = ReadOnlyExceptSingleDollar<D["model"]> & StoreMetaData;

/** Store definition type */
export type StoreDef<Params extends object = {}, Model extends object = {}> = {
    params?: Params;
    model?: Model;
};

type ReadOnlyExceptSingleDollar<T> = {
    // Writable: keys starting with exactly one $
    [K in keyof T as K extends `$$${string}` ? never : K extends `$${string}` ? K : never]: T[K];
} & {
    // Readonly: all others (either don't start with $ or start with $$)
    readonly [K in keyof T as K extends `$${string}` ? (K extends `$$${string}` ? K : never) : K]: DeepReadOnly<T[K]>;
};

/** DeepReadonly from https://stackoverflow.com/questions/41879327/deepreadonly-object-typescript */
type DeepReadOnly<T> = T extends (infer R)[]
    ? ReadOnlyArray<R>
    : T extends Function
    ? T
    : T extends object
    ? ReadOnlyExceptSingleDollar<T>
    : T;

type ReadOnlyArray<T> = ReadonlyArray<ReadOnlyExceptSingleDollar<T>>;
