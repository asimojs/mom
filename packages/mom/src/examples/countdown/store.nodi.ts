import { defineStore } from "@/mom";
import { CountDownIID } from "./store.types";
import { runInAction } from "mobx";

// Countdown implementation with no Dependency Inversion
// section#main
export const CountDown = defineStore(CountDownIID, (store, params) => {
    const { initValue = 10, intervalMs = 1000, autoStart = false } = params;

    const model = store.initModel({
        value: initValue,
        get isRunning() {
            return controller.intervalId > 0;
        },

        /** Start the countdown */
        start(): void {
            if (controller.intervalId) return; // already running
            // note: DI context should be used instead of using setInterval directly
            controller.intervalId = setInterval(() => {
                runInAction(() => {
                    if (model.value > 0) {
                        model.value--;
                    }
                    if (model.value === 0) {
                        model.stop();
                    }
                });
            }, intervalMs);
        },
        /** Stop the countdown */
        stop(): void {
            if (!controller.intervalId) return; // already stopped
            // note: DI context should be used instead of using clearInterval directly
            clearInterval(controller.intervalId);
            controller.intervalId = 0;
        },
        /** Reset the countdown counter */
        reset(): void {
            model.value = initValue;
        },
    });

    const controller = store.initState({
        /** interval identifier created by setInterval() - 0 if not set */
        intervalId: 0,
    });

    store.onInit(() => {
        autoStart && model.start();
    });
    store.onDispose(() => {
        model.stop();
    });
});
// /section#main
