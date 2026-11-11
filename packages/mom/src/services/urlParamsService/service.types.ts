import { asyncIID, ServiceFactory } from "@asimojs/asimo";

/**
 * Service to read or write the URL query parameters (aka. search)
 * Technically, this is a simpe wrapper over browser the location.search property
 */
export interface URLParamsService {
    /**
     * Retrieve all search/query params as a map
     */
    getURLParams(): Map<string, string>;
    /**
     * Create / update the search params.
     * Note: this method doesn't change existing search params that are not in the params
     * list passed as argument
     * @param params the map of params to update. The null value should be used to remove a param
     */
    setURLParams(params: Map<string, string | null> | Record<string, string | null>): void;
}

export const URLParamsServiceIID = asyncIID<URLParamsService>()("mom.services.URLParamsService");

export interface FakeURLParamsServiceController {
    /** Factory to create a child context providing this fake URL params service */
    readonly factory: ServiceFactory<[typeof URLParamsServiceIID]>;
    /** Return the url.search part, encoded - e.g. "?q=123&mode=234" */
    getURLSearch(): string;
    /** Reset internal state */
    reset(initialParams?: Map<string, string | null> | Record<string, string | null>): void;
}
