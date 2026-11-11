import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Container, createContainer } from "@asimojs/asimo";
import { disposeStore, createStore, rootContext } from "@/mom";
import { CountDown } from "./store";
import { CountDownDef, CountDownStore } from "./store.types";
import { createFakeTimeService } from "@/services/timeService/service.mock";
import { FakeTimeServiceController } from "@/services/timeService/service.types";

// section#start
describe("CountDown", () => {
    let context: Container<any>, store: CountDownStore, timeController: FakeTimeServiceController;

    beforeEach(() => {
        timeController = createFakeTimeService();
        context = createContainer({
            extends: [rootContext],
            name: "test:CountDown",
            services: [timeController.factory],
        });
    });

    afterEach(() => {
        store && disposeStore(store);
    });

    async function init(params?: CountDownDef["params"], awaitInitComplete = true) {
        store = createStore(CountDown, { context, ...params });
        if (awaitInitComplete) {
            await store["#initComplete"];
        }
    }

    // /section#start

    describe("Load", () => {
        // section#defaultValues
        it("should support default values", async () => {
            await init({}, false);
            expect(store["#ready"]).toBe(false); // async init

            expect(store.value).toBe(10);
            expect(store.isRunning).toBe(false);

            await store["#initComplete"];
            expect(store["#ready"]).toBe(true);

            // test that the default autoStart is false
            timeController.moveTime(2000); // 2s
            expect(store.value).toBe(10); // unchanged -> not started

            // test the default intervalMs is 1000ms
            store.start();
            timeController.moveTime(999);
            expect(store.value).toBe(10); // not yet

            timeController.moveTime(1);
            expect(store.value).toBe(9); // countdown started
        });
        // /section#defaultValues

        it("should throw an error if no TimeService is provided", async () => {
            let error = "";
            try {
                store = createStore(CountDown);
                await store["#initComplete"];
            } catch (ex) {
                error = "" + ex;
            }
            expect(error).toBe(
                "Unexpected Store error during INIT: AsimoError: [Asimo] Service not found: mom.services.TimeService at /asm",
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
        // section#start-stop
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

            timeController.moveTime(100);
            expect(store.value).toBe(8); // unchanged
            expect(store.isRunning).toBe(false);

            store.start();
            expect(store.isRunning).toBe(true);
            timeController.moveTime(7);

            expect(store.value).toBe(7);
        });
        // /section#start-stop

        it("should stop the countdown when 0 is reached", async () => {
            await init({ autoStart: true });
            expect(store.value).toBe(10);

            timeController.moveTime(9000); // 9s later
            expect(store.value).toBe(1);

            timeController.moveTime(1000); // 1s more
            expect(store.value).toBe(0);

            timeController.moveTime(5000); // 5s more
            expect(store.value).toBe(0); // unchanged
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
