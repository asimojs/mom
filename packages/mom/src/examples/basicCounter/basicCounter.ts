import { storeFactory } from "@/mom";
import { BasicCounterSID } from "./basicCounter.types";

export const BasicCounterStore = storeFactory(BasicCounterSID, (m) => {
    const model = m.makeAutoObservableModel({
        value: 1,
        increment(quantity = 1) {
            model.value += quantity;
        },
    });
});
