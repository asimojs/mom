import { defineStore } from "@/mom";

// section#main
export const Counter = defineStore((store, params: { value?: number; minFormatDigits?: number }) => {
    const minFormatDigits = params.minFormatDigits ?? 2;

    const model = store.initModel({
        value: params.value ?? 0,
        get formattedValue(): string {
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
    return model;
});
// /section#main

export type CounterStore = ReturnType<typeof Counter>;
