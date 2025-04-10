import { mom } from "../../mom";
import { CounterIID } from "./counter.types";

export const Counter = mom.component(CounterIID, (m, props) => {
  if (!props.value) {
    props.value = 0;
  }
  const initValue = props.value;

  const model = m.init({
    initialModel: {
      nbrOfChanges: 0,
    },
    actions: {
      /** Increment the counter by the given quantity (can be negative) - default: 1 */
      increment(quantity = 1) {
        model.$actions.setValue(props.value! + quantity);
      },
      /** Set the counter to a specific value */
      setValue(v: number) {
        if (props.value !== v) {
          props.value = v;
          model.nbrOfChanges++;
          props.onChange?.(v);
        }
      },
      /** Reset the counter to the initial value */
      reset() {
        model.$actions.setValue(initValue);
      },
    },
  });
});
