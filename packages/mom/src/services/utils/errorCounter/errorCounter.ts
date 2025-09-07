import { ErrorCounter } from "./errorCounter.types";

class _ErrorCounter implements ErrorCounter {
    private _count: number = 0;
    private errorsByCount: Map<number, Error> = new Map();

    get count() {
        return this._count;
    }

    incrementCount(): void {
        this._count++;
        const err = this.errorsByCount.get(this._count);
        if (err) {
            throw err;
        }
    }

    registerError(error: Error, countIncrement = 1): void {
        this.errorsByCount.set(this._count + countIncrement, error);
    }

    reset(): void {
        this._count = 0;
        this.errorsByCount.clear();
    }
}

export function createErrorCounter(): ErrorCounter {
    return new _ErrorCounter();
}
