import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createErrorCounter } from "./errorCounter";

describe("Error Counter", () => {
    const err1 = new Error("error1");
    const err2 = new Error("Error2");

    it("should raise errors", async () => {
        const c = createErrorCounter();

        expect(c.count).toBe(0);
        c.incrementCount();
        expect(c.count).toBe(1);

        c.registerError(err1);
        expect(() => c.incrementCount()).toThrow(err1);

        c.incrementCount();
        expect(c.count).toBe(3);
    });

    it("should raise multiple errors", async () => {
        const c = createErrorCounter();

        expect(c.count).toBe(0);
        c.incrementCount();
        expect(c.count).toBe(1);

        c.registerError(err1, 2); // throws at 1+2  = 3
        c.registerError(err2, 4); // throws at 1+4  = 5
        c.incrementCount();
        expect(c.count).toBe(2);

        expect(() => c.incrementCount()).toThrow(err1);
        expect(c.count).toBe(3);

        c.incrementCount();
        expect(c.count).toBe(4);

        expect(() => c.incrementCount()).toThrow(err2);
        expect(c.count).toBe(5);

        c.incrementCount();
        expect(c.count).toBe(6);
    });

    it("should support reset", async () => {
        const c = createErrorCounter();

        expect(c.count).toBe(0);
        c.incrementCount();
        expect(c.count).toBe(1);

        c.registerError(err1, 2); // throws at 1+2  = 3
        c.registerError(err2, 4); // throws at 1+4  = 5
        c.incrementCount();
        expect(c.count).toBe(2);

        c.reset();

        for (let i = 0; 10 > i; i++) {
            expect(c.count).toBe(i);
            c.incrementCount();
        }
    });
});
