import { defineStore } from "@/mom";

export const SimpleCounter = defineStore((store) => {
    const model = store.initModel({
        value: 1,
        increment(quantity = 1) {
            model.value += quantity;
        },
    });
    return model;
});

export type SimpleCounterStore = ReturnType<typeof SimpleCounter>;
