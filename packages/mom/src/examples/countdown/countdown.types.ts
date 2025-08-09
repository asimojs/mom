import { Store, storeIId } from "@/mom.types";

// section#main
type CountDownDef = {
    params: {
        /** The initial countdown counter value - default: 10 */
        initValue?: number;
        /** The countdown time interval in ms - default 1000 */
        intervalMs?: number;
        /** Tell if the countdown should automatically start at init */
        autoStart?: boolean;
    };
    model: {
        /** The countdown counter value */
        value: number;
        /** Tell if the countdown timer is running or stopped */
        isRunning: boolean;

        /** Start the countdown */
        start(): void;
        /** Stop the countdown */
        stop(): void;
        /** Reset the countdown counter */
        reset(): void;
    };
};
// /section#main

export type CountDownStore = Store<CountDownDef>;
export const CountDownSID = storeIId<CountDownDef>("mom.examples.countdown");
