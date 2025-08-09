import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { asm, AsmContext } from "@asimojs/asimo";
import { disposeStore, createStore } from "@/mom";
import { CountDownStore } from "./countdown";
import { pause } from "@/mom.mocks";
import { CountDown } from "./countdown.types";

describe("CountDown", () => {
    let context: AsmContext,
        store: CountDown | null = null;

    beforeEach(() => {
        context = asm.createChildContext("test:CountDown");
    });

    afterEach(() => {
        store && disposeStore(store);
    });

    describe("Load", () => {
        it("should support default values", async () => {
            store = createStore({ $store: CountDownStore });
            expect(store["#ready"]).toBe(true); // sync init
            expect(store.value).toBe(10);
            expect(store.isRunning).toBe(false);
        });

        it("should override default values", async () => {
            store = createStore({ $store: CountDownStore, initValue: 5, intervalMs: 5 });
            expect(store["#ready"]).toBe(true); // sync init
            expect(store.value).toBe(5);
            expect(store.isRunning).toBe(false);

            await pause(10);
            expect(store.value).toBe(5); // not started
            expect(store.isRunning).toBe(false);
        });

        it("should support auto-start", async () => {
            store = createStore({ $store: CountDownStore, initValue: 5, intervalMs: 5, autoStart: true });
            expect(store["#ready"]).toBe(true); // sync init
            expect(store.value).toBe(5);
            expect(store.isRunning).toBe(true); // auto-start

            await pause(8);
            expect(store.value).toBe(4); // started
            expect(store.isRunning).toBe(true);
        });
    });

    describe("Actions", () => {
        it("should support start / stop (autoStart false)", async () => {
            const store = createStore({ $store: CountDownStore, intervalMs: 5 });
            expect(store["#ready"]).toBe(true); // sync init
            expect(store.value).toBe(10);
            expect(store.isRunning).toBe(false);

            store.start();
            expect(store.isRunning).toBe(true);
            await pause(7);
            expect(store.value).toBe(9);
            await pause(5);
            expect(store.value).toBe(8);
            expect(store.isRunning).toBe(true);

            store.stop();
            expect(store.isRunning).toBe(false);

            await pause(10);
            expect(store.value).toBe(8); // unchanged
            expect(store.isRunning).toBe(false);

            store.start();
            expect(store.isRunning).toBe(true);
            await pause(7);

            expect(store.value).toBe(7);
        });

        it("should support start / stop (autoStart true)", async () => {
            const store = createStore({ $store: CountDownStore, intervalMs: 5, autoStart: true });
            expect(store["#ready"]).toBe(true); // sync init
            expect(store.value).toBe(10);

            expect(store.isRunning).toBe(true);
            await pause(7);
            expect(store.value).toBe(9);
            await pause(5);
            expect(store.value).toBe(8);
            expect(store.isRunning).toBe(true);

            store.stop();
            expect(store.isRunning).toBe(false);

            await pause(10);
            expect(store.value).toBe(8); // unchanged
            expect(store.isRunning).toBe(false);

            store.start();
            expect(store.isRunning).toBe(true);
            await pause(7);

            expect(store.value).toBe(7);
        });

        it("should automatically stop the store at disposal", async () => {
            const store = createStore({ $store: CountDownStore, intervalMs: 5, autoStart: true });
            expect(store.isRunning).toBe(true);

            disposeStore(store);
            await store["#disposeComplete"];
            expect(store.isRunning).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
        });
    });
});
