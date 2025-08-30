import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { asm, createContainer, IoCContainer } from "@asimojs/asimo";
import { disposeStore, createStore } from "@/mom";
import { CountDown } from "./countdown";
import { CountDownDef, CountDownStore } from "./countdown.types";
import { createFakeTimeService, FakeTimeServiceController } from "@/services/timeService/timeService.mock";

describe("CountDown", () => {
    let context: IoCContainer, store: CountDownStore, timeController: FakeTimeServiceController;

    beforeEach(() => {
        context = createContainer({ parent: asm, name: "test:CountDown" });
        timeController = createFakeTimeService(context);
    });

    afterEach(() => {
        store && disposeStore(store);
    });

    async function init(params?: CountDownDef["params"], awaitInitComplete = true) {
        store = createStore({ $store: CountDown, $context: context, ...params });
        if (awaitInitComplete) {
            await store["#initComplete"];
        }
    }

    describe("Load", () => {
        it("should support default values", async () => {
            await init({}, false);
            expect(store["#ready"]).toBe(false); // async init

            expect(store.value).toBe(10);
            expect(store.isRunning).toBe(false);

            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);

            // test that the default autoStart is false
            timeController.moveTime(2000);
            expect(store.value).toBe(10); // unchanged

            // test the default intervalMs is 1000ms
            store.start();
            timeController.moveTime(999);
            expect(store.value).toBe(10);

            timeController.moveTime(1);
            expect(store.value).toBe(9); // countdown started

            timeController.moveTime(1000);
            expect(store.value).toBe(8);
        });

        it("should throw an error if no TimeService is provided", async () => {
            asm.logger = null; // prevent error to be logged on the console
            let error = "";
            try {
                store = createStore({ $store: CountDown });
                await store["#initComplete"];
            } catch (ex) {
                error = "" + ex;
            }
            asm.logger = console;
            expect(error).toBe(
                'Unexpected Store error during INIT: Error: ASM [/asm] Interface not found: "mom.services.TimeService"',
            );
        });

        it("should override default values", async () => {
            await init({ initValue: 5, intervalMs: 5 });
            expect(store["#ready"]).toBe(true);
            expect(store.value).toBe(5);
            expect(store.isRunning).toBe(false);

            timeController.moveTime(10);
            expect(store.value).toBe(5); // not started
            expect(store.isRunning).toBe(false);
        });

        it("should support auto-start", async () => {
            await init({ initValue: 5, intervalMs: 5, autoStart: true });
            expect(store["#ready"]).toBe(true);
            expect(store.value).toBe(5);
            expect(store.isRunning).toBe(true); // auto-start

            timeController.moveTime(5);
            expect(store.value).toBe(4); // started
            expect(store.isRunning).toBe(true);
        });
    });

    describe("Actions", () => {
        it("should support start / stop (autoStart false)", async () => {
            await init({ intervalMs: 5 });
            expect(store["#ready"]).toBe(true);
            expect(store.value).toBe(10);
            expect(store.isRunning).toBe(false);

            store.start();
            expect(store.isRunning).toBe(true);
            timeController.moveTime(7);
            expect(store.value).toBe(9);
            timeController.moveTime(5);
            expect(store.value).toBe(8);
            expect(store.isRunning).toBe(true);

            store.stop();
            expect(store.isRunning).toBe(false);

            timeController.moveTime(10);
            expect(store.value).toBe(8); // unchanged
            expect(store.isRunning).toBe(false);

            store.start();
            expect(store.isRunning).toBe(true);
            timeController.moveTime(7);

            expect(store.value).toBe(7);
        });

        it("should support start / stop (autoStart true)", async () => {
            await init({ intervalMs: 5, autoStart: true });
            expect(store["#ready"]).toBe(true);
            expect(store.value).toBe(10);

            expect(store.isRunning).toBe(true);
            timeController.moveTime(7);
            expect(store.value).toBe(9);
            timeController.moveTime(5);
            expect(store.value).toBe(8);
            expect(store.isRunning).toBe(true);

            store.stop();
            expect(store.isRunning).toBe(false);

            timeController.moveTime(10);
            expect(store.value).toBe(8); // unchanged
            expect(store.isRunning).toBe(false);

            store.start();
            expect(store.isRunning).toBe(true);
            timeController.moveTime(7);

            expect(store.value).toBe(7);
        });

        it("should automatically stop the store at disposal", async () => {
            await init({ autoStart: true });
            expect(store.isRunning).toBe(true);

            disposeStore(store);
            await store["#disposeComplete"];
            expect(store.isRunning).toBe(false);
            expect(store["#state"]).toBe("DISPOSED");
        });
    });
});
