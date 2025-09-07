import { asm, createContainer, IoCContainer } from "@asimojs/asimo";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createFakeClipboardService } from "./clipboardService.mock";
import { FakeClipboardServiceController, ClipboardService, ClipboardServiceIID } from "./clipboardService.types";

describe("Fake Clipboard Service", () => {
    let context: IoCContainer, clipboardController: FakeClipboardServiceController;

    beforeEach(() => {
        context = createContainer({ parent: asm, name: "test:fakeClipboardService" });
        clipboardController = createFakeClipboardService(context);
    });

    describe("Read", () => {
        it("should return an empty string when the clipboard is empty", async () => {
            const clipboard = await context.fetch(ClipboardServiceIID);
            expect(await clipboard.readText()).toBe("");
            expect(await clipboard.readText()).toBe(""); // not changed
        });

        it("should throw Errors if not Allowed", async () => {
            clipboardController.throwErrorAfter("readText");
            const clipboard = await context.fetch(ClipboardServiceIID);
            await clipboard.writeText("ABCD");
            await expect(clipboard.readText()).rejects.toThrowError("NotAllowedError");
        });

        it("should throw Errors if not text content", async () => {
            clipboardController.throwErrorAfter("readText", 1, "NotFoundError");
            const clipboard = await context.fetch(ClipboardServiceIID);
            await clipboard.writeText("ABCD");
            await expect(clipboard.readText()).rejects.toThrowError("NotFoundError");
        });

        it("should return the clipboard content when set", async () => {
            createFakeClipboardService(context, "Hello World");
            const clipboard = await context.fetch(ClipboardServiceIID);
            expect(await clipboard.readText()).toBe("Hello World");
            expect(await clipboard.readText()).toBe("Hello World"); // not changed after the 1st call
        });
    });

    describe("Write", () => {
        it("should override the clipboard content", async () => {
            const clipboard = await context.fetch(ClipboardServiceIID);
            expect(await clipboard.readText()).toBe("");
            clipboard.writeText("ABCD");
            expect(await clipboard.readText()).toBe("ABCD");
            expect(await clipboard.readText()).toBe("ABCD");
            clipboard.writeText("EF GH IJ");
            expect(await clipboard.readText()).toBe("EF GH IJ");
        });

        it("should throw Errors if not Allowed", async () => {
            clipboardController.throwErrorAfter("writeText", 2);
            const clipboard = await context.fetch(ClipboardServiceIID);
            await clipboard.writeText("ABCD");
            expect(await clipboard.readText()).toBe("ABCD");
            await expect(clipboard.writeText("XYZ")).rejects.toThrowError("NotAllowedError");
            expect(await clipboard.readText()).toBe("ABCD"); // unchanged
        });

        it("should reset the clipboard content", async () => {
            clipboardController.throwErrorAfter("writeText", 2);
            clipboardController.throwErrorAfter("readText", 2);
            const clipboard = await context.fetch(ClipboardServiceIID);
            await clipboard.writeText("ABCD");
            expect(await clipboard.readText()).toBe("ABCD");

            clipboardController.reset();
            expect(await clipboard.readText()).toBe("");

            await clipboard.writeText("DEF"); // does not throw
            expect(await clipboard.readText()).toBe("DEF"); // does not throw
            await clipboard.writeText("GHI"); // does not throw
            expect(await clipboard.readText()).toBe("GHI"); // does not throw
        });
    });
});
