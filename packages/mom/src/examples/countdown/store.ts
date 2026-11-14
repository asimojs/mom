import { defineStore } from "@/mom";
import { runInAction } from "mobx";
import { TimeService, TimeServiceIID } from "@/services/timeService/service.types";

export type CountDownParams = {
    /** The initial countdown counter value - default: 10 */
    initValue?: number;
    /** The countdown time interval in ms - default 1000 */
    intervalMs?: number;
    /** Tell if the countdown should automatically start at init */
    autoStart?: boolean;
};

// Countdown implementation with Dependency Inversion on TimeService
// section#main
export const CountDown = defineStore((store, params: CountDownParams) => {
    const { initValue = 10, intervalMs = 1000, autoStart = false } = params;
    let timeService: TimeService | null = null;

    const model = store.initModel({
        value: initValue,
        get isRunning() {
            return controller.intervalId > 0;
        },

        /** Start the countdown */
        start(): void {
            if (controller.intervalId || !timeService) return; // already running
            controller.intervalId = timeService.setInterval(() => {
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
            if (!controller || !timeService) return; // already stopped
            timeService.clearInterval(controller.intervalId);
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

    store.onInit(async () => {
        timeService = await store.context.fetch(TimeServiceIID);
        autoStart && model.start();
    });
    store.onDispose(() => {
        model.stop();
    });

    return model;
});
// /section#main

export type CountDownStore = ReturnType<typeof CountDown>;
