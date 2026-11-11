import { Container, createContainer } from "@asimojs/asimo";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createFakeURLParamsService } from "./service.mock";
import { FakeURLParamsServiceController, URLParamsService, URLParamsServiceIID } from "./service.types";
import { rootContext } from "@/mom";

describe("Fake URL Params Service", () => {
    let context: Container<any>, urlParamsController: FakeURLParamsServiceController, urlParamsService: URLParamsService;

    beforeEach(async () => {
        await init();
    });

    const init = async (initialParams?: { [name: string]: string }) => {
        urlParamsController = createFakeURLParamsService(initialParams);
        context = createContainer({
            name: "test:fakeURLParamsService",
            extends: [rootContext],
            services: [urlParamsController.factory],
        });
        urlParamsService = await context.fetch(URLParamsServiceIID);
    };

    it("should retrieve initial params & support reset", async () => {
        // override beforeEach to set different init params
        await init({ type: "A B C D", name: "abcd" });

        const p1 = urlParamsService.getURLParams();
        expect(p1.get("x")).toBe(undefined);
        expect(p1.get("name")).toBe("abcd");
        expect(p1.get("type")).toBe("A B C D");

        const p2 = urlParamsService.getURLParams();
        expect(p2).not.toBe(p1); // clone

        expect(urlParamsController.getURLSearch()).toBe("?name=abcd&type=A%20B%20C%20D"); // ordered

        urlParamsController.reset({ foo: "bar" });
        expect(urlParamsController.getURLSearch()).toBe("?foo=bar");

        urlParamsController.reset();
        expect(urlParamsController.getURLSearch()).toBe("?");
    });

    it("should support write and delete through a Map", async () => {
        expect(urlParamsController.getURLSearch()).toBe("?");

        urlParamsService.setURLParams(
            new Map([
                ["query", "AAA"],
                ["key1", "KEY1"],
            ]),
        );
        expect(urlParamsController.getURLSearch()).toBe("?key1=KEY1&query=AAA");

        urlParamsService.setURLParams(new Map([["key2", "KEY2"]]));
        expect(urlParamsController.getURLSearch()).toBe("?key1=KEY1&key2=KEY2&query=AAA");

        urlParamsService.setURLParams(
            new Map([
                ["key1", null],
                ["key3", "KEY3"],
            ]),
        );
        expect(urlParamsController.getURLSearch()).toBe("?key2=KEY2&key3=KEY3&query=AAA");
        urlParamsService.setURLParams(
            new Map([
                ["key2", null],
                ["key3", null],
            ]),
        );
        expect(urlParamsController.getURLSearch()).toBe("?query=AAA");
    });

    it("should support write and delete through a record", async () => {
        expect(urlParamsController.getURLSearch()).toBe("?");

        urlParamsService.setURLParams({ query: "AAA", key1: "KEY1" });
        expect(urlParamsController.getURLSearch()).toBe("?key1=KEY1&query=AAA");

        urlParamsService.setURLParams(new Map([["key2", "KEY2"]]));
        expect(urlParamsController.getURLSearch()).toBe("?key1=KEY1&key2=KEY2&query=AAA");

        urlParamsService.setURLParams({ key1: null, key3: "KEY3" });
        expect(urlParamsController.getURLSearch()).toBe("?key2=KEY2&key3=KEY3&query=AAA");
        urlParamsService.setURLParams({ key2: null, key3: null });
        expect(urlParamsController.getURLSearch()).toBe("?query=AAA");
    });

    it("should support reset (no params)", async () => {
        urlParamsService.setURLParams({ query: "AAA", key1: "KEY1" });
        expect(urlParamsController.getURLSearch()).toBe("?key1=KEY1&query=AAA");

        urlParamsController.reset();
        expect(urlParamsController.getURLSearch()).toBe("?");
    });

    it("should support reset (with params)", async () => {
        urlParamsService.setURLParams({ query: "AAA", key1: "KEY1" });
        expect(urlParamsController.getURLSearch()).toBe("?key1=KEY1&query=AAA");

        urlParamsController.reset({ key1: null, key3: "KEY3" });
        expect(urlParamsController.getURLSearch()).toBe("?key3=KEY3");

        urlParamsController.reset(
            new Map([
                ["query", "AAA"],
                ["key1", "KEY1"],
                ["key2", null],
            ]),
        );
        expect(urlParamsController.getURLSearch()).toBe("?key1=KEY1&key2=&query=AAA");
    });
});
