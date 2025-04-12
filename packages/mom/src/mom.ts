import { InterfaceId } from "@asimojs/asimo/dist/asimo.types";
import {
  Mom,
  MomComponent,
  MomComponentDefinition,
  MomComponentContext,
  MomLoadOptions,
  MomModel,
  Public,
} from "./mom.types";
import { observable } from "mobx";
import { asm } from "@asimojs/asimo";
import { configure } from "mobx";

/** Mobx configuration */
configure({
  /**
   * Observables genereated by mom are readonly outside the component function
   * (except for props but this is the intended behavior)
   * So typescript will prevent modifying model values outside the component.
   * As such enforcing actions is not needed (on the good side it makes code much simpler)
   **/
  enforceActions: "never",
});

export const mom: Mom = {
  /**
   * Define a mom component
   * @param componentIID
   * @param cf the component function
   */
  component<ModelType extends MomModel>(
    componentIID: InterfaceId<MomComponent<ModelType>>,
    cf: (m: MomComponentContext<ModelType>, props: ModelType["$props"]) => void
  ): MomComponent<ModelType> {
    function cptFunction(m: MomComponentContext<ModelType>, props: ModelType["$props"]): Public<ModelType> {
      cf(m, props);
      // TODO: call m.init()
      return m.model! as unknown as Public<ModelType>;
    }
    (cptFunction as MomComponent<ModelType>).$ns = componentIID.ns;
    asm.registerFactory(componentIID, () => cptFunction as MomComponent<ModelType>);

    return cptFunction as MomComponent<ModelType>;
  },

  /**
   * Instantiate a mom component
   * @returns a the component model (readonly except for $props)
   */
  load<ModelType extends MomModel>(
    cpt: { $cpt: MomComponent<ModelType> } & ModelType["$props"],
    options?: MomLoadOptions
  ): Public<ModelType> {
    const cptFunction = cpt.$cpt;
    const context = options?.context || asm;

    cpt.$cpt = null as any;
    const props = observable(cpt);
    const m = createMomComponentContext();
    let model: ModelType | null = null;

    cptFunction(m, props);
    // TBD: try/catch ? or keep it like this?

    if (model === null) {
      throw "Invalid Component function: m.createModel() was not called";
    }
    return model;

    function createMomComponentContext(): MomComponentContext<ModelType> {
      let createModelCalled = false;
      const momCtxt = {
        context,
        model: null as ModelType | null,
        createModel(def: MomComponentDefinition<ModelType>): ModelType {
          if (createModelCalled) {
            throw "Invalid Component function: m.createModel() must only be called once";
          }
          createModelCalled = true;
          model = observable({
            $ns: cptFunction.$ns,
            $context: context,
            $props: props,
            $actions: def.actions, // No need to wrap into mobx actions (cf. enforceActions comment)
            ...def.initialModel,
          }) as unknown as ModelType;
          momCtxt.model = model;
          return model;
        },
      };
      return momCtxt;
    }
  },
};
