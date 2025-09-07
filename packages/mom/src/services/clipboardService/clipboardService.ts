import { asm } from "@asimojs/asimo";
import { ClipboardService, ClipboardServiceIID } from "./clipboardService.types";

export const clipboardService: ClipboardService = {
    writeText(newClipText: string): Promise<void> {
        return navigator.clipboard.writeText(newClipText);
    },
    readText(): Promise<string> {
        return navigator.clipboard.readText();
    },
};

asm.registerService(ClipboardServiceIID, () => clipboardService);
