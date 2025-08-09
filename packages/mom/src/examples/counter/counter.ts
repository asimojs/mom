import { storeFactory } from "@/mom";
import { CounterSID } from "./counter.types";

// section#main
export const Counter = storeFactory(CounterSID, (m, params) => {
    const minFormatDigits = params.minFormatDigits ?? 2;

    const model = m.makeAutoObservableModel({
        value: params.value ?? 0,
        get formattedValue() {
            // Format the counter with padding "0" at the start - e.g. "03"
            return String(model.value).padStart(minFormatDigits, "0");
        },

        /** Increment the counter by the given quantity (can be negative) - default: 1 */
        increment(quantity = 1) {
            model.value += quantity;
        },
        /** Reset the counter */
        reset(value = 0) {
            model.value = value;
        },
    });
});
// /section#main
