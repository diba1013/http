import urlcat from "urlcat";
import { RequestParameters, RequestBody } from "@/global.types";

export function url(base?: string, path = "/", parameters: RequestParameters = {}): string {
	return base === undefined ? urlcat(path, parameters) : urlcat(base, path, parameters);
}

export function merge<T extends RequestBody>(first?: T, second?: T): T | undefined {
	return second ?? first;
}
