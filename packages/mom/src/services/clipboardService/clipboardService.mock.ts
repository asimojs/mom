import { IoCContainer } from "@asimojs/asimo";
import { ClipboardService, ClipboardServiceIID, FakeClipboardServiceController } from "./clipboardService.types";
import { createErrorCounter } from "../utils/errorCounter/errorCounter";

class FakeClipboardService implements ClipboardService, FakeClipboardServiceController {
    private readTextErrorCounter = createErrorCounter();
    private writeTextErrorCounter = createErrorCounter();

    constructor(private clipboardContent: string = "") {}

    async writeText(newClipText: string): Promise<void> {
        this.writeTextErrorCounter.incrementCount(); // may throw
        this.clipboardContent = newClipText;
    }

    async readText(): Promise<string> {
        this.readTextErrorCounter.incrementCount(); // may throw
        return this.clipboardContent;
    }

    /** Reset internal state */
    reset(): void {
        this.clipboardContent = "";
        this.readTextErrorCounter.reset();
        this.writeTextErrorCounter.reset();
    }
    /**
     * Configure the service to throw an error on one of the selected methods
     * after the nth call
     * @param method the method that will throw the error
     * @param nthCall when the error should be thrown (default: 1 = next call) - cannot be less than 1
     * @param errorType which error should be raised (default: NotAllowedError)
     */
    throwErrorAfter(
        method: "writeText" | "readText",
        nthCall = 1,
        errorType: "NotAllowedError" | "NotFoundError" = "NotAllowedError",
    ) {
        if (nthCall < 1) {
            nthCall = 1;
        }
        if (method === "writeText") {
            this.writeTextErrorCounter.registerError(
                new DOMException("NotAllowedError Description", "NotAllowedError"),
                nthCall,
            );
        } else if (method === "readText") {
            this.readTextErrorCounter.registerError(new DOMException(errorType + " Description", errorType), nthCall);
        }
    }
}

export function createFakeCllipboardService(
    context: IoCContainer,
    clipboardContent?: string,
): FakeClipboardServiceController {
    const service = new FakeClipboardService(clipboardContent);
    context.registerService(ClipboardServiceIID, () => service);
    return service;
}
