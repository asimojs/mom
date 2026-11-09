import { asyncIID, ServiceFactory } from "@asimojs/asimo";

export interface ClipboardService {
    /**
     * Write text in the system's clipoard - cf. navigator.clipboard.writeText()
     * May throw NotAllowedError - if writing to the clipboard is not allowed.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
     * @param newClipText the string to be written to the clipboard.
     * @returns a Promise that is resolved once the clipboard's contents have been updated
     */
    writeText(newClipText: string): Promise<void>;
    /**
     * Read text in the system's clipoard - cf. navigator.clipboard.readText()
     * May throw :
     * - NotAllowedError DOMException, if writing to the clipboard is not allowed.
     * - or NotFoundError, if the clipboard indicates that it contains data that can be represented as a text but is unable to provide a textual representation
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText
     * @returns a Promise that resolves with a string containing the textual contents of the clipboard
     */
    readText(): Promise<string>;
}

export const ClipboardServiceIID = asyncIID<ClipboardService>()("mom.services.ClipboardService");

export interface FakeClipboardServiceController {
    /** Factory to create a child context providing this fake clipboard service */
    readonly factory: ServiceFactory<[typeof ClipboardServiceIID]>;
    /**
     * Configure the service to throw an error on one of the selected methods
     * after the nth call
     * @param method the method that will throw the error
     * @param nthCall when the error should be thrown (default: 1 = next call) - cannot be less than 1
     * @param errorType which error should be raised (default: NotAllowedError)
     */
    throwErrorAfter(
        method: "writeText" | "readText",
        nthCall?: number,
        errorType?: "NotAllowedError" | "NotFoundError",
    ): void;
    /** Reset internal state */
    reset(): void;
}
