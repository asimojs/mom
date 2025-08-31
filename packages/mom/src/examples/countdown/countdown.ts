import { storeFactory } from "@/mom";
import { CountDownIID } from "./countdown.types";
import { runInAction } from "mobx";
import { TimeService, TimeServiceIID } from "@/services/timeService/timeService.types";

// Countdown implementation with Dependency Inversion on TimeService
// section#main
export const CountDown = storeFactory(CountDownIID, (m, params) => {
    const { initValue = 10, intervalMs = 1000, autoStart = false } = params;
    let timeService: TimeService | null = null;

    const model = m.makeAutoObservableModel({
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

    const controller = m.makeAutoObservableController({
        /** interval identifier created by setInterval() - 0 if not set */
        intervalId: 0,
        async init() {
            timeService = await m.context.fetch(TimeServiceIID);
            autoStart && model.start();
        },
        dispose() {
            model.stop();
        },
    });
});
// /section#main
