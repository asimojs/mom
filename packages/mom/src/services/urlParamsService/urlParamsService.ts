import { asm } from "@asimojs/asimo";
import { URLParamsService, URLParamsServiceIID } from "./urlParamsService.types";

const urlParmsService = {
    getURLParams: function (): Map<string, string> {
        const params: Map<string, string> = new Map();
        if (typeof location !== "undefined") {
            const urlParams = new URLSearchParams(location.search);
            urlParams.forEach((value, key) => params.set(key, value));
        }
        return params;
    },
    setURLParams: function (params: Map<string, string | null> | Record<string, string | null>): void {
        if (typeof location === "undefined" || typeof history === "undefined") return;
        const paramsMap = paramsToMap(params, false);
        const urlParams = new URLSearchParams(location.search);
        paramsMap.forEach((value, key) => {
            if (value === null) {
                urlParams.delete(key);
            } else {
                urlParams.set(key, "" + value);
            }
        });
        const url = `${location.protocol}//${location.host}${location.pathname}?${params}`;
        history.replaceState({ path: url }, "", url);
    },
} satisfies URLParamsService;

export function paramsToMap(
    params: Map<string, string | null> | Record<string, string | null>,
    ignoreNullValues: true,
): Map<string, string>;
export function paramsToMap(
    params: Map<string, string | null> | Record<string, string | null>,
    ignoreNullValues: false,
): Map<string, string | null>;
export function paramsToMap(
    params: Map<string, string | null> | Record<string, string | null>,
    ignoreNullValues: boolean,
): Map<string, string | null> {
    if (params instanceof Map) {
        return params;
    }
    const m: Map<string, string | null> = new Map();
    for (const k of Object.getOwnPropertyNames(params)) {
        if (!ignoreNullValues || params[k] != null) {
            m.set(k, params[k]);
        }
    }
    return m;
}

asm.registerService(URLParamsServiceIID, () => urlParmsService);
