// section#all
import { asyncIID } from "@asimojs/asimo";

export type IntervalId = number;
export type TimeoutId = number;

/**
 * Common time utilies (current time, intervals and timeouts)
 */
export interface TimeService {
    /** Get the current time in ms - cf. Date.now() */
    readonly now: number;
    /**
     * Register a callback that will be called at regular intervals
     * Wrapper on window.setInterval()
     * @param handler the callback function
     * @param delayMs the delay in ms (default: 0)
     **/
    setInterval(handler: () => void, delayMs: number): IntervalId;
    /**
     * Cancel an interval callback
     * Wrapper on window.clearInterval()
     * @param id the interval id returned by setInterval()
     * @see setInterval()
     **/
    clearInterval(id: IntervalId | undefined): void;
    /**
     * Register a callback that will be called once in x milliseconds
     * Wrapper on window.setTimeout()
     * @param handler the callback function
     * @param timeoutMs the delay in ms (default: 0)
     */
    setTimeout(handler: () => void, timeoutMs?: number): TimeoutId;
    /**
     * Cancel a timeout callback before it gets executed
     * Wrapper on window.clearTimeout()
     * @param id the timeout id returned by setTimeout()
     * @see setTimeout()
     */
    clearTimeout(id: TimeoutId | undefined): void;
}

export const TimeServiceIID = asyncIID<TimeService>("mom.services.TimeService");
// /section#all

// section#controllerAPI
export interface FakeTimeServiceController {
    /** Move the current time by x ms and executes all interval / timeout callbacks */
    moveTime(durationMs: number): void;
    /** Move the current time to the next callback and execute it */
    executeNextCallback(): boolean;
    /** Return the number of intervals still active */
    readonly numberOfActiveIntervals: number;
    /** Return the numbe of timeouts still active */
    readonly numberOfActiveTimeouts: number;
    /** Reset internal state */
    reset(): void;
}
// /section#controllerAPI
