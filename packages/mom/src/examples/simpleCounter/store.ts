import { defineStore } from "@/mom";
import { SimpleCounterIID } from "./store.types";

export const SimpleCounter = defineStore(SimpleCounterIID, (store) => {
    const model = store.initModel({
        value: 1,
        increment(quantity = 1) {
            model.value += quantity;
        },
    });
});
