import { InterfaceId } from "@asimojs/asimo/dist/asimo.types";
import {
    Mom,
    MomComponent,
    MomComponentDefinition,
    MomComponentContext,
    MomLoadOptions,
    MomModel,
    RO,
    RootModel,
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

/**
 * Enriched MomComponentContext with internal properties/methods
 * that should not be visible to the component developer to limit confusion/errors
 */
interface MomComponentInternalContext<ModelType extends MomModel> extends MomComponentContext<ModelType> {
    parent: MomComponentInternalContext<any> | null;
    childComponents: Map<MomModel, MomComponentInternalContext<any>> | null;
    init?(): void | Promise<void>;
    dispose?(): void;
}

const DONE = Promise.resolve();
const NEVER = new Promise<void>(() => {});

export const mom: Mom = {
    /**
     * Define a mom component
     * @param componentIID
     * @param cf the component function
     */
    component<ModelType extends MomModel>(
        componentIIDorCf:
            | InterfaceId<MomComponent<ModelType>>
            | ((m: MomComponentContext<ModelType>, props: ModelType["$props"]) => void),
        cf?: (m: MomComponentContext<ModelType>, props: ModelType["$props"]) => void,
    ): MomComponent<ModelType> {
        let cptFn: (m: MomComponentContext<ModelType>, props: ModelType["$props"]) => void;
        let componentIID: InterfaceId<MomComponent<ModelType>> | null = null;
        let ns = "";
        if (typeof componentIIDorCf === "function") {
            cptFn = componentIIDorCf;
        } else {
            ns = componentIIDorCf.ns;
            if (cf === undefined) {
                throw "";
            }
            cptFn = cf;
        }

        function cpt(m: MomComponentContext<ModelType>, props: ModelType["$props"]): RO<ModelType> {
            cptFn(m, props);
            const mi = m as MomComponentInternalContext<ModelType>;
            const initResult = mi.init?.();
            if (
                initResult &&
                typeof initResult === "object" &&
                "then" in initResult &&
                typeof initResult.then === "function"
            ) {
                mi.model!.$ready = false;
                mi.model!.$initComplete = initResult.then(() => {
                    mi.model!.$ready = true;
                });
            } else {
                mi.model!.$ready = true;
                mi.model!.$initComplete = DONE;
            }
            return m.model! as unknown as RO<ModelType>;
        }
        (cpt as MomComponent<ModelType>).$ns = ns;
        if (componentIID) {
            asm.registerFactory(componentIID, () => cpt as MomComponent<ModelType>);
        }

        return cpt as MomComponent<ModelType>;
    },

    /**
     * Instantiate a mom component
     * @returns a the component model (readonly except for $props)
     */
    load<ModelType extends MomModel>(
        cpt: { $cpt: MomComponent<ModelType> } & ModelType["$props"],
        options?: MomLoadOptions,
    ): RootModel<ModelType> {
        const context = options?.context || asm;

        let rootCtxt: MomComponentInternalContext<any> | null = null;
        const c = loadCpt(null, cpt);
        (c as any).$dispose = () => {
            if (rootCtxt) {
                disposeCtxt(rootCtxt);
            }
        };
        return c as RootModel<ModelType>;

        function loadCpt<M extends MomModel>(
            parent: MomComponentInternalContext<any> | null,
            props: { $cpt: MomComponent<M> } & M["$props"],
        ) {
            const cptFunction = props.$cpt;
            props.$cpt = null as any;
            const _props = observable(props);
            const m = createMomComponentContext(parent, cptFunction, _props);

            cptFunction(m, _props);
            // TBD: try/catch ? or keep it like this?

            if (m.model === null) {
                throw `[${cptFunction.$ns}] Invalid Component function: m.createModel() was not called`;
            }

            if (parent) {
                if (!parent.childComponents) {
                    parent.childComponents = new Map();
                }
                parent.childComponents.set(m.model, m);
            }
            return m.model as unknown as RO<M>;
        }

        function createMomComponentContext<M extends MomModel>(
            parent: MomComponentInternalContext<any> | null,
            cptFunction: MomComponent<M>,
            props: M["$props"],
        ): MomComponentInternalContext<M> {
            let createModelCalled = false;
            const momCtxt: MomComponentInternalContext<M> = {
                parent,
                childComponents: null,
                context,
                model: null as M | null,
                createModel(def: MomComponentDefinition<M>): M {
                    if (createModelCalled) {
                        throw "Invalid Component function: m.createModel() must only be called once";
                    }
                    createModelCalled = true;
                    const model = observable({
                        $ns: cptFunction.$ns,
                        $context: context,
                        $props: props,
                        // No need to wrap into mobx actions (cf. enforceActions comment)
                        ...("actions" in def ? { $actions: def.actions } : {}),
                        $ready: false,
                        $disposed: false,
                        ...def.initialModel,
                    }) as unknown as M;
                    momCtxt.model = model;
                    momCtxt.init = def.init;
                    momCtxt.dispose = def.dispose;
                    return model;
                },
                mount<M extends MomModel>(props: { $cpt: MomComponent<M> } & M["$props"]): RO<M> {
                    return loadCpt(momCtxt, props);
                },
                unmount<M extends MomModel>(cpt: M | null): null {
                    if (cpt) {
                        disposeCpt(momCtxt, cpt as any);
                    }
                    return null;
                },
            };
            if (!rootCtxt) {
                rootCtxt = momCtxt;
            }
            return momCtxt;
        }

        function disposeCpt<M extends MomModel>(parent: MomComponentInternalContext<M>, c: M) {
            const mi = parent.childComponents?.get(c);
            if (mi) {
                // remove from parent map
                parent.childComponents!.delete(c);
                disposeCtxt(mi);
            }
        }

        function disposeCtxt(mi: MomComponentInternalContext<any>) {
            const model = mi.model;
            model.$ready = false;
            model.$initComplete = NEVER;

            // TODO: dispose computed values and autoRuns

            // call dispose
            mi.dispose?.();

            // call dispose on all child components
            if (mi.childComponents) {
                for (const c of mi.childComponents.values()) {
                    disposeCpt(mi, c.model);
                }
            }
            model.$disposed = true;
        }
    },
};
