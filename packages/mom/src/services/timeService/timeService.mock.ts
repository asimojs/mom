import { IoCContainer } from "@asimojs/asimo";
import { FakeTimeServiceController, IntervalId, TimeoutId, TimeService, TimeServiceIID } from "./timeService.types";

const DEFAULT_DATE = "2025-01-01T12:00:00.000Z";
const DEVAULT_NOW = new Date(DEFAULT_DATE).getTime();

/**
 * Callback linked list used to store the next callbacks to execute
 */
interface CallBack {
    cb: () => void;
    delayMs: number; // the initial delay in ms
    timerId: string; // interval or timeout id prefixed with "I" or "T" for intervals or timeouts
    execTime: number;
    isTimeout: boolean;
    next: CallBack | null;
}

class FakeTimeService implements FakeTimeServiceController, TimeService {
    private initialTimeMs = 0;
    private intervalCount = 0;
    private nextCallback: CallBack | null = null;

    constructor(private currentTimeMs: number) {
        this.initialTimeMs = currentTimeMs;
    }

    get now() {
        return this.currentTimeMs;
    }

    setInterval(cb: () => void, delayMs: number): IntervalId {
        this.intervalCount++;
        this.addPendingCallback(cb, delayMs, "I:" + this.intervalCount, false);
        return this.intervalCount;
    }

    clearInterval(id: IntervalId): void {
        this.cancelPendingCallback("I:" + id);
    }

    setTimeout(cb: () => void, timeoutMs: number = 0): TimeoutId {
        this.intervalCount++;
        this.addPendingCallback(cb, timeoutMs, "T:" + this.intervalCount, true);
        return this.intervalCount;
    }

    clearTimeout(id: TimeoutId): void {
        this.cancelPendingCallback("T:" + id);
    }

    /**
     * Move time by duration Ms and executes all pending intervals and timeouts
     * @param durationMs
     */
    moveTime(durationMs: number) {
        if (durationMs < 0) return;
        const targetTimeMs = this.currentTimeMs + durationMs;
        while (true) {
            if (!this.processNextCallback(targetTimeMs)) return;
        }
    }

    /**
     * Execute the next registered Inteval or Timeout callback and updates the current time accordingly
     * @returns true if a callback was executed
     **/
    executeNextCallback(): boolean {
        if (this.nextCallback) {
            return this.processNextCallback(this.nextCallback.execTime);
        }
        return false;
    }

    /**
     * Tells how many active intervals are still running
     */
    get numberOfActiveIntervals() {
        return this.countPendingCallbacks(false);
    }

    /**
     * Tells how many active timeouts are still running
     * @returns
     */
    get numberOfActiveTimeouts() {
        return this.countPendingCallbacks(true);
    }

    /** Reset internal state */
    reset() {
        this.intervalCount = 0;
        this.nextCallback = null;
        this.currentTimeMs = this.initialTimeMs;
    }

    /**
     * Add a new pending callback to the linked list
     */
    private addPendingCallback(cb: () => void, delayMs: number, timerId: string, isTimeout: boolean) {
        if (delayMs < 0) return;
        const execTime = this.currentTimeMs + delayMs;
        const cbItem: CallBack = { cb, timerId, delayMs, execTime, isTimeout, next: null };
        if (!this.nextCallback) {
            this.nextCallback = cbItem;
        } else if (execTime < this.nextCallback.execTime) {
            // insert first
            cbItem.next = this.nextCallback;
            this.nextCallback = cbItem;
        } else {
            let prev = this.nextCallback;
            while (prev.next && execTime >= prev.next.execTime) {
                prev = prev.next;
            }
            cbItem.next = prev.next;
            prev.next = cbItem;
        }
    }

    /**
     * Cancel a pending callback
     */
    private cancelPendingCallback(timerId: string) {
        if (!this.nextCallback) return;
        let prev = this.nextCallback;
        if (prev.timerId === timerId) {
            this.nextCallback = prev.next;
            return;
        }
        while (prev.next && prev.next.timerId !== timerId) {
            prev = prev.next;
        }
        if (prev.next && prev.next.timerId === timerId) {
            prev.next = prev.next.next;
        }
    }

    /**
     * Process the next pending callback if conditions are met
     * @param targetTimeMs the target current time
     * @returns true if the callback was executed
     */
    private processNextCallback(targetTimeMs: number): boolean {
        if (!this.nextCallback || this.nextCallback.execTime > targetTimeMs) {
            this.currentTimeMs = targetTimeMs;
            return false; // no callback executed
        }

        const cbItem = this.nextCallback;
        this.nextCallback = cbItem.next;
        if (cbItem.execTime < this.currentTimeMs) {
            // defensive code to avoid an infinite loop
            console.log("TimeService Callback Error: Invalid execTime");
            return false;
        }
        this.currentTimeMs = cbItem.execTime;
        try {
            cbItem.cb();
            if (!cbItem.isTimeout) {
                // create a new callback for intervals
                this.addPendingCallback(cbItem.cb, cbItem.delayMs, cbItem.timerId, false);
            }
        } catch (ex) {
            console.log("TimeService Callback Error", ex);
        }
        return true;
    }

    private countPendingCallbacks(isTimeout: boolean) {
        let count = 0;
        let cb: CallBack | null = this.nextCallback;
        while (cb) {
            if (isTimeout && cb.isTimeout) {
                count++;
            } else if (!isTimeout && !cb.isTimeout) {
                count++;
            }
            cb = cb.next;
        }
        return count;
    }
}

/**
 * Create a fake TimeService instance and register it in the IoC container
 * @param context the IoC Container
 * @param now (optional) the current time (ms or date string) - e.g. 1756116157108 or "2025-08-01" default: "2025-01-01T12:00:00.000Z"
 */
export function createFakeTimeService(context: IoCContainer, now?: number | string): FakeTimeServiceController {
    let currentTimeMs = DEVAULT_NOW;
    if (now !== undefined) {
        currentTimeMs = typeof now === "number" ? now : new Date(now).getTime();
    }
    const service = new FakeTimeService(currentTimeMs);
    context.registerService(TimeServiceIID, () => service);
    return service;
}
