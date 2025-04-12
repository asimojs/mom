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
    cf: (m: MomComponentContext<ModelType>, props: ModelType["$props"]) => void
  ): MomComponent<ModelType>;

  /**
   * Instantiate a mom component
   * @returns a the component model (readonly except for $props)
   */
  load<ModelType extends MomModel>(
    cpt: { $cpt: MomComponent<ModelType> } & ModelType["$props"],
    options?: MomLoadOptions
  ): Public<ModelType>;
}

/** Optional config params to configure a component context */
export interface MomLoadOptions {
  /** The dependency context to use for this component - default: root asm */
  context?: AsmContext;
}
export interface MomComponent<ModelType extends MomModel> {
  /** Component namespace (= IID namespace) */
  $ns: string;
  (m: MomComponentContext<ModelType>, props: ModelType["$props"]): Public<ModelType>;
}

/**
 * Recursively set all values readonly except for the $props
 */
export type Public<ModelType extends MomModel> = DeepReadonly<Omit<ModelType, "$props">> & {
  $props: ModelType["$props"];
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
}

export interface MomComponentDefinition<ModelType extends MomModel> {
  /** Model initial values - before load() gets called */
  initialModel: Omit<ModelType, "$ns" | "$props" | "$actions" | "$context">;
  /** Model actions (public methods exposed to the view and parent components) */
  actions: ModelType["$actions"];
  /**
   * Model initialization function - automatically called after the component function call
   * too load model data that need to be retrieved asynchronously
   **/
  init?(): void | Promise<void>;
  /** Component disposal - automatically called when a component is unmounted */
  dispose?(): void;
}

export interface MomModel<ModelProps extends object = {}, ModelActions = unknown> {
  /** The component interface namespace */
  $ns: string;
  /** The context associated to the component - allows to share or retrieve dependencies */
  $context: AsmContext;
  /** The model props - i.e. the arguments that can be passed when mounting the component */
  $props: ModelProps;
  /** The component actions: the functions exposed to the component view(s) and the component parents */
  $actions: ModelActions;
}

/** DeepReadonly from https://stackoverflow.com/questions/41879327/deepreadonly-object-typescript */
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
