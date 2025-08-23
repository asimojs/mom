import { storeFactory } from "@/mom";
import { BasicCounterIID } from "./basicCounter.types";

export const BasicCounter = storeFactory(BasicCounterIID, (m) => {
    const model = m.makeAutoObservableModel({
        value: 1,
        increment(quantity = 1) {
            model.value += quantity;
        },
    });
});
