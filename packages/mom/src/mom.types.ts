import { AsmContext, InterfaceId } from "@asimojs/asimo/dist/asimo.types";
import { interfaceId as _interfaceId } from "@asimojs/asimo";

/** Create an interface identifier */
export const interfaceId = _interfaceId;
export interface Mom {
    /**
     * Define a mom component
     * @param componentIID
     * @param cf the component function
     */
    component<ModelType extends MomModel>(
        componentIID: InterfaceId<MomComponent<ModelType>>,
        cf: (m: MomComponentContext<ModelType>, props: ModelType["$props"]) => void,
    ): MomComponent<ModelType>;
    /**
     * Define a mom component
     * @param cf the component function
     */
    component<ModelType extends MomModel>(
        cf: (m: MomComponentContext<ModelType>, props: ModelType["$props"]) => void,
    ): MomComponent<ModelType>;

    /**
     * Instantiate a mom component
     * @returns a the component model (readonly except for $props)
     */
    load<ModelType extends MomModel>(
        props: { $cpt: MomComponent<ModelType> } & ModelType["$props"],
        options?: MomLoadOptions,
    ): RootModel<ModelType>;
}

/** Optional config params to configure a component context */
export interface MomLoadOptions {
    /** The dependency context to use for this component - default: root asm */
    context?: AsmContext;
}
export interface MomComponent<ModelType extends MomModel> {
    /** Component namespace (= IID namespace) */
    $ns: string;
    (m: MomComponentContext<ModelType>, props: ModelType["$props"]): RO<ModelType>;
}

/**
 * Recursively set all values readonly except for the $props
 */
export type RO<ModelType extends MomModel> = DeepRoExceptProps<ModelType>;

/**
 * Extended model for root components created with mom.load()
 */
export type RootModel<ModelType extends MomModel> = RO<ModelType> & {
    /** Dispose a root component created with mom.load */
    $dispose(): void;
};

export interface MomComponentContext<ModelType extends MomModel> {
    /**
     * The context associated to the component - allows to pass objects or dependencies
     * to all child components without definining explicit props
     * Note: can be overridden with a child context to limit impact on the parent context
     **/
    context: AsmContext;
    /**
     * Component model - null until init() is called
     */
    model: ModelType | null;
    /**
     * Create the component model
     * After the component function has completed, the component init method will be called
     **/
    createModel(def: MomComponentDefinition<ModelType>): ModelType;
    /**
     * Mount a child component that should be attached to the parent's model
     * This will:
     * - call the component init()
     * - set and update the component.$ready and component.$initiComplete properties
     * e.g. model.myCpt = m.mount({$cpt: MyCpt, myprop:"hello"});
     **/
    mount<M extends MomModel>(props: { $cpt: MomComponent<M> } & M["$props"]): RO<M>;
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
    unmount<M extends MomModel>(cpt: M | null): null;
}

export type MomComponentDefinition<ModelType extends MomModel> = ModelType["$actions"] extends Record<
    PropertyKey,
    never
>
    ? {
          /** Model initial values - before load() gets called */
          initialModel: MomInitialModelValues<ModelType>;
          /**
           * Model initialization function - automatically called after the component function call
           * too load model data that need to be retrieved asynchronously
           **/
          init?(): void | Promise<void>;
          /** Component disposal - automatically called when a component is unmounted */
          dispose?(): void;
      }
    : {
          /** Model initial values - before load() gets called */
          initialModel: MomInitialModelValues<ModelType>;
          /** Model actions (public methods exposed to the view and parent components) */
          actions: ModelType["$actions"];
          /**
           * Model initialization function - automatically called after the component function call
           * too load model data that need to be retrieved asynchronously
           **/
          init?(): void | Promise<void>;
          /** Component disposal - automatically called when a component is unmounted */
          dispose?(): void;
      };

export type MomInitialModelValues<ModelType> = Omit<
    ModelType,
    "$ns" | "$props" | "$actions" | "$context" | "$ready" | "$initComplete" | "$disposed"
>;

/** Base model properties */
export interface MomModel<ModelProps extends object = {}, ModelActions = {}> {
    /** The component interface namespace */
    $ns: string;
    /** The context associated to the component - allows to share or retrieve dependencies */
    $context: AsmContext;
    /** The model props - i.e. the arguments that can be passed when mounting the component */
    $props: ModelProps;
    /** The component actions: the functions exposed to the component view(s) and the component parents */
    $actions: ModelActions;
    /** True when the initialization is complete (init may be asynchronous) and component is NOT disposed */
    $ready: boolean;
    /** Promise resolving when initialization is complete and component is NOT disposed */
    $initComplete: Promise<void>;
    /** True when a component is disposed */
    $disposed: boolean;
}

/** DeepReadonly from https://stackoverflow.com/questions/41879327/deepreadonly-object-typescript */
type DeepRoExceptProps<T> = T extends (infer R)[]
    ? RoArray<R>
    : T extends Function
    ? T
    : T extends object
    ? RoExceptProps<T>
    : T;

interface RoArray<T> extends ReadonlyArray<DeepRoExceptProps<T>> {}

type RoExceptProps<T> = {
    readonly [P in keyof T]: P extends "$props" | "$context" ? T[P] : DeepRoExceptProps<T[P]>;
};
