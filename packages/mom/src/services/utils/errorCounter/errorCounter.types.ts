/**
 * This object increments a counter and throws
 * errors when the counter reaches a certain value.
 * Note: errors have to be registered through registerError() before hand.
 */
export interface ErrorCounter {
    /** The current counter value */
    readonly count: number;
    /** Increment the counter and eventually throws an Error */
    incrementCount(): void;
    /**
     * Register an error that will be automatically thrown after count is incrememted by countIncrement
     * @param error the error to throw
     * @param countIncrement the increment after which the error will be thrown - default: 1
     **/
    registerError(error: Error, countIncrement?: number): void;
    /** Reset the internal state (count back to 0 and no more errors registered) */
    reset(): void;
}
