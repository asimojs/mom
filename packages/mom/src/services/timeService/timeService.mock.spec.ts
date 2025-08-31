import { asm, createContainer, IoCContainer } from "@asimojs/asimo";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createFakeTimeService } from "./timeService.mock";
import { FakeTimeServiceController, TimeService, TimeServiceIID } from "./timeService.types";

describe("Fake Time Service", () => {
    let context: IoCContainer,
        output = "",
        startTs = 0;
    let ftc: FakeTimeServiceController, ts: TimeService;

    beforeEach(() => {
        output = "";
        context = createContainer({ parent: asm, name: "test:fakeTimeService" });
    });

    const cbA = () => {
        output += "+A:" + (ts.now - startTs);
    };
    const cbB = () => {
        output += "+B:" + (ts.now - startTs);
    };
    const cbC = () => {
        output += "+C:" + (ts.now - startTs);
    };

    describe("Now", () => {
        it("should use the default date", async () => {
            createFakeTimeService(context);
            const ts = await context.fetch(TimeServiceIID);
            const defaultTs = new Date("2025-01-01T12:00:00.000Z").getTime();
            expect(ts.now).toBe(defaultTs);
            expect(defaultTs).toBe(1735732800000);
        });

        it("should use the date passed as argument", async () => {
            createFakeTimeService(context, "2007-11-09");
            const ts = await context.fetch(TimeServiceIID);
            const d = new Date(ts.now);
            expect(d.toISOString()).toBe("2007-11-09T00:00:00.000Z");
            expect(ts.now).toBe(1194566400000);
        });
    });

    describe("Intervals and Timeouts", () => {
        beforeEach(async () => {
            ftc = createFakeTimeService(context);
            ts = await context.fetch(TimeServiceIID);
            startTs = ts.now;
        });

        it("should create Intervals", async () => {
            expect(ts).toBe(ftc);

            const int1 = ts.setInterval(cbA, 1000);
            const int2 = ts.setInterval(cbB, 500);
            expect(ftc.numberOfActiveTimeouts).toBe(0);
            expect(ftc.numberOfActiveIntervals).toBe(2);
            expect(output).toBe("");
            ftc.moveTime(100);
            expect(ts.now).toBe(startTs + 100);
            expect(output).toBe("");
            ftc.moveTime(400);
            expect(ts.now).toBe(startTs + 500);
            expect(output).toBe("+B:500");
            ftc.moveTime(400);
            expect(ts.now).toBe(startTs + 900);
            expect(output).toBe("+B:500");
            ftc.moveTime(1200);
            expect(ts.now).toBe(startTs + 2100);
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+A:2000+B:2000");
            ftc.moveTime(1900);
            expect(ts.now).toBe(startTs + 4000);
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+A:2000+B:2000+B:2500+A:3000+B:3000+B:3500+A:4000+B:4000");
            expect(ftc.numberOfActiveIntervals).toBe(2);

            output = "";
            ts.clearInterval(int2);
            expect(ftc.numberOfActiveIntervals).toBe(1);
            ftc.moveTime(2600);
            expect(ts.now).toBe(startTs + 6600);
            expect(output).toBe("+A:5000+A:6000");
            expect(ftc.numberOfActiveIntervals).toBe(1);
            ts.clearInterval(int1);
            expect(ftc.numberOfActiveIntervals).toBe(0);
            ftc.moveTime(1400);
            expect(ts.now).toBe(startTs + 8000);
            expect(output).toBe("+A:5000+A:6000"); // unchanged
        });

        it("should create Timeouts", async () => {
            const int1 = ts.setTimeout(cbA, 1000);
            const int2 = ts.setTimeout(cbB, 500);

            expect(ftc.numberOfActiveTimeouts).toBe(2);
            expect(ftc.numberOfActiveIntervals).toBe(0);
            ftc.moveTime(100);
            expect(ts.now).toBe(startTs + 100);
            expect(output).toBe("");
            expect(ftc.numberOfActiveTimeouts).toBe(2);
            ftc.moveTime(400);
            expect(ts.now).toBe(startTs + 500);
            expect(output).toBe("+B:500");
            expect(ftc.numberOfActiveTimeouts).toBe(1);
            ftc.moveTime(400);
            expect(ts.now).toBe(startTs + 900);
            expect(output).toBe("+B:500");
            ftc.moveTime(1200);
            expect(ts.now).toBe(startTs + 2100);
            expect(output).toBe("+B:500+A:1000");
            expect(ftc.numberOfActiveTimeouts).toBe(0);
            ftc.moveTime(4900);
            expect(ts.now).toBe(startTs + 7000);
            expect(output).toBe("+B:500+A:1000");

            expect(ftc.numberOfActiveTimeouts).toBe(0);
        });

        it("should mix interfals and timeouts", async () => {
            ts.setInterval(cbA, 1000);
            ts.setInterval(cbB, 500);
            ts.setTimeout(cbC, 2000);
            expect(ftc.numberOfActiveTimeouts).toBe(1);
            expect(ftc.numberOfActiveIntervals).toBe(2);
            expect(output).toBe("");
            ftc.moveTime(100);
            expect(ts.now).toBe(startTs + 100);
            expect(output).toBe("");
            ftc.moveTime(800);
            expect(ts.now).toBe(startTs + 900);
            expect(output).toBe("+B:500");
            ftc.moveTime(1200);
            expect(ts.now).toBe(startTs + 2100);
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+C:2000+A:2000+B:2000");
            ftc.moveTime(1900);
            expect(ts.now).toBe(startTs + 4000);
            expect(output).toBe(
                "+B:500+A:1000+B:1000+B:1500+C:2000+A:2000+B:2000+B:2500+A:3000+B:3000+B:3500+A:4000+B:4000",
            );
        });

        it("should cancel timeout and intervals", async () => {
            const intA = ts.setInterval(cbA, 1000);
            const intB = ts.setInterval(cbB, 500);
            const tmoC = ts.setTimeout(cbC, 2000);
            expect(ftc.numberOfActiveTimeouts).toBe(1);
            expect(ftc.numberOfActiveIntervals).toBe(2);
            ftc.moveTime(1500);
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500");
            ts.clearInterval(intB);
            expect(ftc.numberOfActiveTimeouts).toBe(1);
            expect(ftc.numberOfActiveIntervals).toBe(1);
            ts.clearTimeout(tmoC);
            expect(ftc.numberOfActiveTimeouts).toBe(0);
            expect(ftc.numberOfActiveIntervals).toBe(1);
            ftc.moveTime(5000);
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+A:2000+A:3000+A:4000+A:5000+A:6000");
            ts.clearInterval(intA);
            ftc.moveTime(5000);
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+A:2000+A:3000+A:4000+A:5000+A:6000"); // unchanged
        });

        it("should support reset", async () => {
            ts.setInterval(cbA, 1000);
            ts.setInterval(cbB, 500);
            ts.setTimeout(cbC, 2000);
            expect(ftc.numberOfActiveTimeouts).toBe(1);
            expect(ftc.numberOfActiveIntervals).toBe(2);
            ftc.moveTime(800);
            expect(ts.now).toBe(startTs + 800);

            ftc.reset();
            expect(ts.now).toBe(startTs);
            expect(ftc.numberOfActiveTimeouts).toBe(0);
            expect(ftc.numberOfActiveIntervals).toBe(0);
        });

        it("should support moving time to next callback", async () => {
            ts.setInterval(cbA, 1000);
            ts.setInterval(cbB, 500);
            ts.setTimeout(cbC, 2200);

            expect(output).toBe("");
            expect(ts.now).toBe(startTs);

            ftc.executeNextCallback();
            expect(output).toBe("+B:500");
            expect(ts.now).toBe(startTs + 500);

            ftc.executeNextCallback();
            expect(output).toBe("+B:500+A:1000");
            expect(ts.now).toBe(startTs + 1000);

            ftc.executeNextCallback();
            expect(output).toBe("+B:500+A:1000+B:1000");
            expect(ts.now).toBe(startTs + 1000);

            ftc.executeNextCallback();
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500");
            expect(ts.now).toBe(startTs + 1500);

            ftc.executeNextCallback();
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+A:2000");
            expect(ts.now).toBe(startTs + 2000);

            ftc.executeNextCallback();
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+A:2000+B:2000");
            expect(ts.now).toBe(startTs + 2000);

            ftc.executeNextCallback();
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+A:2000+B:2000+C:2200");
            expect(ts.now).toBe(startTs + 2200);

            ftc.executeNextCallback();
            expect(output).toBe("+B:500+A:1000+B:1000+B:1500+A:2000+B:2000+C:2200+B:2500");
            expect(ts.now).toBe(startTs + 2500);
        });
    });
});
