import { factory } from "@asimojs/asimo";
import { registerRootService } from "@/mom";
import { ClipboardService, ClipboardServiceIID } from "./clipboardService.types";

export const clipboardService: ClipboardService = {
    writeText(newClipText: string): Promise<void> {
        return navigator.clipboard.writeText(newClipText);
    },
    readText(): Promise<string> {
        return navigator.clipboard.readText();
    },
};

export const clipboardServiceFactory = factory({
    provide: [ClipboardServiceIID],
    load: async () => clipboardService,
});

registerRootService(clipboardServiceFactory);
