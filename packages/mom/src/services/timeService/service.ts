import { factory } from "@asimojs/asimo";
import { registerRootService } from "@/mom";
import { IntervalId, TimeoutId, TimeService, TimeServiceIID } from "./service.types";

export const timeService: TimeService = {
    get now() {
        return Date.now();
    },
    setInterval(cb: () => void, delayMs: number): IntervalId {
        return setInterval(cb, delayMs) as number;
    },
    clearInterval(id: IntervalId): void {
        clearInterval(id);
    },
    setTimeout(cb: () => void, timeoutMs: number = 0): TimeoutId {
        return setTimeout(cb, timeoutMs) as number;
    },
    clearTimeout(id: TimeoutId): void {
        clearTimeout(id);
    },
};

export const timeServiceFactory = factory({
    provide: [TimeServiceIID],
    load: async () => timeService,
});

registerRootService(timeServiceFactory);
