import { IoCContainer } from "@asimojs/asimo";
import { FakeURLParamsServiceController, URLParamsService, URLParamsServiceIID } from "./urlParamsService.types";
import { FakeClipboardServiceController } from "../clipboardService/clipboardService.types";
import { paramsToMap } from "./urlParamsService";

class FakeURLParamsService implements URLParamsService, FakeURLParamsServiceController {
    private params: Map<string, string> = new Map();

    constructor(initialParams?: { [name: string]: string }) {
        if (initialParams) {
            this.reset(initialParams);
        }
    }

    // URLParamsService
    getURLParams(): Map<string, string> {
        const params: Map<string, string> = new Map();
        this.params.forEach((value, key) => {
            params.set(key, value);
        });
        return params; // clone
    }
    setURLParams(params: Map<string, string | null> | Record<string, string | null>): void {
        const paramsMap = paramsToMap(params, false);
        paramsMap.forEach((value, key) => {
            if (value === null) {
                this.params.delete(key);
            } else {
                this.params.set(key, value);
            }
        });
    }

    // FakeURLParamsServiceController
    getURLSearch(): string {
        const keys = [...this.params.keys()].sort();
        const queryParams: string[] = [];
        for (const k of keys) {
            queryParams.push(`${k}=${this.params.get(k) ?? ""}`);
        }
        return encodeURI(`?${queryParams.join("&")}`);
    }
    reset(initialParams?: Map<string, string | null> | Record<string, string | null>): void {
        if (initialParams) {
            this.params = paramsToMap(initialParams, true);
        } else {
            this.params.clear();
        }
    }
}

export function createFakeURLParamsService(
    context: IoCContainer,
    initialParams?: { [name: string]: string },
): FakeURLParamsServiceController {
    const service = new FakeURLParamsService(initialParams);
    context.registerService(URLParamsServiceIID, () => service);
    return service;
}
