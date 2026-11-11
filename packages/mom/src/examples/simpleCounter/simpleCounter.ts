import { storeFactory } from "@/mom";
import { SimpleCounterIID } from "./simpleCounter.types";

export const SimpleCounter = storeFactory(SimpleCounterIID, (m) => {
    const model = m.makeAutoObservableModel({
        value: 1,
        increment(quantity = 1) {
            model.value += quantity;
        },
    });
});
